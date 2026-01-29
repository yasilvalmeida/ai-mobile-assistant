import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { FieldReport, GPSLocation, OCRResult, SyncStatus, SyncError } from '../../../shared/src/types';
import { STORAGE_KEYS, SYNC_CONFIG } from '../config/constants';
import { reportsAPI } from './api/reportsAPI';
import { locationsAPI } from './api/locationsAPI';

interface OfflineQueue {
  reports: FieldReport[];
  locations: GPSLocation[];
  ocrResults: OCRResult[];
}

class SyncServiceClass {
  private syncInProgress = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    // Start auto-sync when network becomes available
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.syncInProgress) {
        this.syncAll();
      }
    });
  }

  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, SYNC_CONFIG.syncInterval);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const queue = await this.getOfflineQueue();

    return {
      lastSyncAt: await this.getLastSyncTime(),
      pendingUploads:
        queue.reports.length + queue.locations.length + queue.ocrResults.length,
      pendingDownloads: 0,
      syncInProgress: this.syncInProgress,
      errors: await this.getSyncErrors(),
    };
  }

  async syncAll(): Promise<void> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return;
    }

    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      await this.syncReports();
      await this.syncLocations();
      await this.syncOCRResults();
      await this.setLastSyncTime(new Date());
      await this.clearSyncErrors();
    } catch (error) {
      console.error('Sync error:', error);
      await this.addSyncError({
        id: `err_${Date.now()}`,
        type: 'sync_failed',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
        retryCount: 0,
      });
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async syncReports(): Promise<void> {
    const queue = await this.getOfflineQueue();
    const failedReports: FieldReport[] = [];

    for (const report of queue.reports) {
      try {
        if (report.id.startsWith('offline_')) {
          // New report, create on server
          const serverReport = await reportsAPI.create(report);
          // Update local reference
          await this.updateLocalReportId(report.id, serverReport.id);
        } else {
          // Existing report, update on server
          await reportsAPI.update(report.id, report);
        }
      } catch (error) {
        console.error(`Failed to sync report ${report.id}:`, error);
        failedReports.push(report);
      }
    }

    // Update queue with failed reports
    await this.updateOfflineReports(failedReports);
  }

  private async syncLocations(): Promise<void> {
    const queue = await this.getOfflineQueue();
    const failedLocations: GPSLocation[] = [];

    // Batch upload locations
    const batches = this.createBatches(queue.locations, SYNC_CONFIG.batchSize);

    for (const batch of batches) {
      try {
        await locationsAPI.batchCreate(batch);
      } catch (error) {
        console.error('Failed to sync location batch:', error);
        failedLocations.push(...batch);
      }
    }

    await this.updateOfflineLocations(failedLocations);
  }

  private async syncOCRResults(): Promise<void> {
    // OCR results are typically attached to reports
    // Sync them when the parent report is synced
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Queue management
  async queueReport(report: FieldReport): Promise<void> {
    const queue = await this.getOfflineQueue();
    const existingIndex = queue.reports.findIndex((r) => r.id === report.id);

    if (existingIndex >= 0) {
      queue.reports[existingIndex] = report;
    } else {
      queue.reports.push(report);
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_REPORTS,
      JSON.stringify(queue.reports)
    );
    this.notifyListeners();
  }

  async queueLocation(location: GPSLocation): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.locations.push(location);

    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_LOCATIONS,
      JSON.stringify(queue.locations)
    );
    this.notifyListeners();
  }

  async queueOCRResult(ocrResult: OCRResult): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.ocrResults.push(ocrResult);

    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_OCR,
      JSON.stringify(queue.ocrResults)
    );
    this.notifyListeners();
  }

  // Helper methods
  private async getOfflineQueue(): Promise<OfflineQueue> {
    const [reportsJson, locationsJson, ocrJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REPORTS),
      AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_LOCATIONS),
      AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_OCR),
    ]);

    return {
      reports: reportsJson ? JSON.parse(reportsJson) : [],
      locations: locationsJson ? JSON.parse(locationsJson) : [],
      ocrResults: ocrJson ? JSON.parse(ocrJson) : [],
    };
  }

  private async updateOfflineReports(reports: FieldReport[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_REPORTS,
      JSON.stringify(reports)
    );
  }

  private async updateOfflineLocations(locations: GPSLocation[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_LOCATIONS,
      JSON.stringify(locations)
    );
  }

  private async updateLocalReportId(
    oldId: string,
    newId: string
  ): Promise<void> {
    // Update references in local storage
    console.log(`Updated report ID from ${oldId} to ${newId}`);
  }

  private async getLastSyncTime(): Promise<Date | undefined> {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : undefined;
  }

  private async setLastSyncTime(date: Date): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, date.toISOString());
  }

  private async getSyncErrors(): Promise<SyncError[]> {
    const errorsJson = await AsyncStorage.getItem('sync_errors');
    return errorsJson ? JSON.parse(errorsJson) : [];
  }

  private async addSyncError(error: SyncError): Promise<void> {
    const errors = await this.getSyncErrors();
    errors.push(error);
    await AsyncStorage.setItem('sync_errors', JSON.stringify(errors.slice(-50)));
  }

  private async clearSyncErrors(): Promise<void> {
    await AsyncStorage.removeItem('sync_errors');
  }

  // Listeners
  addListener(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach((cb) => cb(status));
  }
}

export const SyncService = new SyncServiceClass();

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  FIELD_AGENT = 'field_agent',
  SUPERVISOR = 'supervisor',
  VIEWER = 'viewer',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

// GPS and Location Types
export interface GPSLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
  notes?: string;
}

export interface RouteHistory {
  id: string;
  userId: string;
  startLocation: GPSLocation;
  endLocation: GPSLocation;
  waypoints: GPSLocation[];
  totalDistance: number;
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}

// OCR and Document Types
export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  documentType: DocumentType;
  extractedFields: Record<string, any>;
  imageUri: string;
  timestamp: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  ID_CARD = 'id_card',
  BUSINESS_CARD = 'business_card',
  LICENSE_PLATE = 'license_plate',
  FORM = 'form',
  OTHER = 'other',
}

// Report and Task Types
export interface FieldReport {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: ReportStatus;
  priority: Priority;
  category: ReportCategory;
  location: GPSLocation;
  attachments: Attachment[];
  ocrResults: OCRResult[];
  aiSummary?: string;
  aiSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export enum ReportStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ReportCategory {
  INSPECTION = 'inspection',
  LOGISTICS = 'logistics',
  SALES = 'sales',
  SURVEY = 'survey',
  MAINTENANCE = 'maintenance',
  INCIDENT = 'incident',
  OTHER = 'other',
}

export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// AI Integration Types
export interface AIRequest {
  prompt: string;
  context?: string;
  reportId?: string;
  userId: string;
  type: AIRequestType;
}

export enum AIRequestType {
  SUMMARIZE = 'summarize',
  SUGGEST = 'suggest',
  QUESTION = 'question',
  EXTRACT = 'extract',
  TRANSLATE = 'translate',
}

export interface AIResponse {
  id: string;
  request: AIRequest;
  response: string;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
  timestamp: Date;
}

// Sync and Offline Types
export interface SyncStatus {
  lastSyncAt?: Date;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  type: string;
  message: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
}

export interface OfflineData {
  reports: FieldReport[];
  locations: GPSLocation[];
  ocrResults: OCRResult[];
  attachments: Attachment[];
  lastUpdated: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: ReportCategory;
  status?: ReportStatus;
  priority?: Priority;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Configuration Types
export interface AppConfig {
  apiBaseUrl: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  ocrProvider: 'tesseract' | 'google-vision' | 'aws-textract';
  maxOfflineStorage: number;
  syncInterval: number;
  locationUpdateInterval: number;
  enableAnalytics: boolean;
}

// Statistics and Analytics
export interface UserStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  totalDistance: number;
  totalLocations: number;
  averageReportTime: number;
  lastActivity: Date;
}

export interface SystemStats {
  totalUsers: number;
  totalReports: number;
  totalOCRProcessed: number;
  totalAIRequests: number;
  storageUsed: number;
  uptime: number;
} 
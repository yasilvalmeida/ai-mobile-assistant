import Tesseract from 'tesseract.js';
import ImageResizer from 'react-native-image-resizer';
import { OCRResult, BoundingBox, DocumentType } from '../../../shared/src/types';
import { OCR_CONFIG } from '../config/constants';

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractResult {
  data: {
    text: string;
    confidence: number;
    words: TesseractWord[];
  };
}

class OCRServiceClass {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker(OCR_CONFIG.language, 1, {
      logger: (m) => console.log('Tesseract:', m.status, m.progress),
    });
  }

  async processImage(imageUri: string): Promise<OCRResult> {
    await this.initialize();

    // Resize image for better performance
    const resizedImage = await this.resizeImage(imageUri);

    const result = await this.worker!.recognize(resizedImage.uri) as TesseractResult;

    const boundingBoxes: BoundingBox[] = result.data.words.map((word) => ({
      x: word.bbox.x0,
      y: word.bbox.y0,
      width: word.bbox.x1 - word.bbox.x0,
      height: word.bbox.y1 - word.bbox.y0,
      text: word.text,
      confidence: word.confidence / 100,
    }));

    const documentType = this.detectDocumentType(result.data.text);
    const extractedFields = this.extractFields(result.data.text, documentType);

    return {
      id: `ocr_${Date.now()}`,
      text: result.data.text,
      confidence: result.data.confidence / 100,
      boundingBoxes,
      documentType,
      extractedFields,
      imageUri,
      timestamp: new Date(),
    };
  }

  private async resizeImage(
    imageUri: string
  ): Promise<{ uri: string; width: number; height: number }> {
    try {
      const response = await ImageResizer.createResizedImage(
        imageUri,
        OCR_CONFIG.maxImageSize,
        OCR_CONFIG.maxImageSize,
        'JPEG',
        OCR_CONFIG.compressionQuality * 100,
        0
      );
      return {
        uri: response.uri,
        width: response.width,
        height: response.height,
      };
    } catch (error) {
      console.warn('Image resize failed, using original:', error);
      return { uri: imageUri, width: 0, height: 0 };
    }
  }

  private detectDocumentType(text: string): DocumentType {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('invoice') ||
      lowerText.includes('bill to') ||
      lowerText.includes('total due')
    ) {
      return DocumentType.INVOICE;
    }

    if (
      lowerText.includes('receipt') ||
      lowerText.includes('thank you for your purchase') ||
      lowerText.includes('subtotal')
    ) {
      return DocumentType.RECEIPT;
    }

    if (
      lowerText.includes('driver license') ||
      lowerText.includes('identification') ||
      lowerText.includes('date of birth')
    ) {
      return DocumentType.ID_CARD;
    }

    if (
      lowerText.includes('@') &&
      (lowerText.includes('tel') || lowerText.includes('phone'))
    ) {
      return DocumentType.BUSINESS_CARD;
    }

    // Check for license plate pattern (e.g., ABC 1234)
    const licensePlatePattern = /[A-Z]{2,3}[\s-]?\d{3,4}|[A-Z]{1,2}\d{1,2}[\s-][A-Z]{3}/i;
    if (licensePlatePattern.test(text) && text.length < 20) {
      return DocumentType.LICENSE_PLATE;
    }

    if (
      lowerText.includes('form') ||
      lowerText.includes('signature') ||
      lowerText.includes('please fill')
    ) {
      return DocumentType.FORM;
    }

    return DocumentType.OTHER;
  }

  private extractFields(
    text: string,
    documentType: DocumentType
  ): Record<string, any> {
    const fields: Record<string, any> = {};

    switch (documentType) {
      case DocumentType.INVOICE:
        fields.invoiceNumber = this.extractPattern(text, /invoice\s*#?\s*:?\s*(\w+)/i);
        fields.totalAmount = this.extractPattern(text, /total\s*:?\s*\$?([\d,.]+)/i);
        fields.date = this.extractPattern(text, /date\s*:?\s*([\d/.-]+)/i);
        break;

      case DocumentType.RECEIPT:
        fields.totalAmount = this.extractPattern(text, /total\s*:?\s*\$?([\d,.]+)/i);
        fields.date = this.extractPattern(text, /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
        fields.merchant = this.extractFirstLine(text);
        break;

      case DocumentType.BUSINESS_CARD:
        fields.email = this.extractPattern(text, /[\w.-]+@[\w.-]+\.\w+/);
        fields.phone = this.extractPattern(text, /[\d\s()-]{10,}/);
        fields.name = this.extractFirstLine(text);
        break;

      case DocumentType.ID_CARD:
        fields.name = this.extractPattern(text, /name\s*:?\s*(.+)/i);
        fields.dateOfBirth = this.extractPattern(text, /dob\s*:?\s*([\d/.-]+)/i);
        fields.idNumber = this.extractPattern(text, /(?:id|no\.?)\s*:?\s*(\w+)/i);
        break;

      case DocumentType.LICENSE_PLATE:
        const plateMatch = text.match(/[A-Z]{2,3}[\s-]?\d{3,4}|[A-Z]{1,2}\d{1,2}[\s-][A-Z]{3}/i);
        fields.plateNumber = plateMatch ? plateMatch[0].toUpperCase() : null;
        break;
    }

    return fields;
  }

  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1] || match[0] : null;
  }

  private extractFirstLine(text: string): string | null {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    return lines.length > 0 ? lines[0].trim() : null;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const OCRService = new OCRServiceClass();

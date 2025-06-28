import {
  formatDate,
  calculateDistance,
  generateId,
  validateEmail,
  truncateText,
  formatFileSize,
} from '../index';

describe('Shared Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      // The exact format may vary by locale, but should contain basic elements
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should handle different dates', () => {
      const date1 = new Date('2023-12-25T00:00:00Z');
      const date2 = new Date('2024-06-01T12:45:30Z');
      
      const formatted1 = formatDate(date1);
      const formatted2 = formatDate(date2);
      
      expect(formatted1).toContain('Dec');
      expect(formatted1).toContain('25');
      expect(formatted2).toContain('Jun');
      expect(formatted2).toContain('1');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between New York and Los Angeles (approximately 3944 km)
      const nyLat = 40.7128;
      const nyLon = -74.0060;
      const laLat = 34.0522;
      const laLon = -118.2437;
      
      const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
      
      // Should be approximately 3944 km (within 50 km tolerance)
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same coordinates', () => {
      const lat = 40.7128;
      const lon = -74.0060;
      
      const distance = calculateDistance(lat, lon, lat, lon);
      
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Distance between two close points (approximately 1 km apart)
      const lat1 = 40.7128;
      const lon1 = -74.0060;
      const lat2 = 40.7218; // About 1 km north
      const lon2 = -74.0060;
      
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      // Should be approximately 1 km
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate IDs with reasonable length', () => {
      const id = generateId();
      
      // Should be at least 10 characters long
      expect(id.length).toBeGreaterThan(10);
      // Should not be too long (less than 50 characters)
      expect(id.length).toBeLessThan(50);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        '',
        'user name@domain.com',
        'user@domain',
        'user@@domain.com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than max length', () => {
      const text = 'This is a very long text that should be truncated';
      const maxLength = 20;
      
      const result = truncateText(text, maxLength);
      
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(maxLength + 3); // +3 for '...'
    });

    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const maxLength = 20;
      
      const result = truncateText(text, maxLength);
      
      expect(result).toBe(text);
    });

    it('should handle text equal to max length', () => {
      const text = 'Exactly twenty chars';
      const maxLength = 20;
      
      const result = truncateText(text, maxLength);
      
      expect(result).toBe(text);
    });

    it('should handle empty text', () => {
      const text = '';
      const maxLength = 10;
      
      const result = truncateText(text, maxLength);
      
      expect(result).toBe('');
    });

    it('should handle max length of 0', () => {
      const text = 'Some text';
      const maxLength = 0;
      
      const result = truncateText(text, maxLength);
      
      expect(result).toBe('...');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1000)).toBe('1000 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should handle large numbers', () => {
      const largeSize = 1000 * 1024 * 1024 * 1024; // 1000 GB
      const result = formatFileSize(largeSize);
      
      expect(result).toContain('GB');
      expect(result).toContain('1000');
    });

    it('should handle decimal precision', () => {
      const size = 1234567; // Should be formatted with 2 decimal places
      const result = formatFileSize(size);
      
      // Should contain a decimal point for precision
      expect(result).toMatch(/\d+\.\d{1,2}/);
    });
  });
}); 
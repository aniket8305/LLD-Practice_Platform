import { describe, it, expect } from 'vitest';
import { TextContent } from '../../src/domain/Submission.js';

function createTextContent(overrides: Record<string, string> = {}) {
  return new TextContent({
    classesAndResponsibilities: 'Class ParkingLot manages parking spots and tracks availability. Class Vehicle represents a parked vehicle with type and plate.',
    relationships: 'ParkingLot HAS-MANY ParkingSpot. ParkingSpot HAS-ONE Vehicle (optional). ParkingLotController uses ParkingLot.',
    designDecisions: 'Used Strategy pattern for ParkingStrategy to allow different allocation algorithms (nearest, first-available).',
    tradeoffs: 'Chose array over linked list for parking spots because random access is more common than insertion.',
    ...overrides,
  });
}

describe('TextContent', () => {
  describe('validate', () => {
    it('should pass validation with all required sections', () => {
      const content = createTextContent();
      const result = content.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when classesAndResponsibilities is empty', () => {
      const content = createTextContent({ classesAndResponsibilities: '' });
      const result = content.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Classes & Responsibilities section is required');
    });

    it('should fail when relationships is empty', () => {
      const content = createTextContent({ relationships: '' });
      const result = content.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Relationships section is required');
    });

    it('should fail when designDecisions is empty', () => {
      const content = createTextContent({ designDecisions: '' });
      const result = content.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Design Decisions section is required');
    });

    it('should not require tradeoffs section', () => {
      const content = createTextContent({ tradeoffs: '' });
      const result = content.validate();
      expect(result.isValid).toBe(true);
    });

    it('should fail when required section is too short', () => {
      const content = createTextContent({ classesAndResponsibilities: 'Too short' });
      const result = content.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('too short');
    });
  });

  describe('getRawText', () => {
    it('should concatenate all sections with headers', () => {
      const content = createTextContent();
      const raw = content.getRawText();
      expect(raw).toContain('## Classes & Responsibilities');
      expect(raw).toContain('## Relationships');
      expect(raw).toContain('## Design Decisions');
      expect(raw).toContain('## Trade-offs & Extensibility');
    });
  });

  describe('getSections', () => {
    it('should return all 4 sections', () => {
      const content = createTextContent();
      const sections = content.getSections();
      expect(sections.size).toBe(4);
      expect(sections.has('Classes & Responsibilities')).toBe(true);
      expect(sections.has('Relationships')).toBe(true);
      expect(sections.has('Design Decisions')).toBe(true);
      expect(sections.has('Trade-offs & Extensibility')).toBe(true);
    });
  });
});

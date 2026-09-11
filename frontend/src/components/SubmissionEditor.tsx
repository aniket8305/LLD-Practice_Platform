import { useState } from 'react';
import type { TextSubmissionContent } from '../types/index.js';
import { Send } from 'lucide-react';

interface Props {
  initialContent?: TextSubmissionContent;
  onSubmit: (content: TextSubmissionContent) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

const sections = [
  {
    key: 'classesAndResponsibilities' as const,
    label: 'Classes & Responsibilities',
    placeholder:
      'List your main classes and their responsibilities.\n\nExample:\nClass ParkingLot: Manages parking floors and tracks overall availability.\nClass ParkingSpot: Represents a single spot with size and availability status.\nClass Vehicle: Represents a vehicle with type, plate number, and size.',
    required: true,
  },
  {
    key: 'relationships' as const,
    label: 'Relationships',
    placeholder:
      'Describe how your classes relate to each other.\n\nExample:\nParkingLot HAS-MANY ParkingFloor\nParkingFloor HAS-MANY ParkingSpot\nParkingSpot HAS-ONE Vehicle (optional)\nParkingLotController USES ParkingLot',
    required: true,
  },
  {
    key: 'designDecisions' as const,
    label: 'Design Decisions',
    placeholder:
      'Explain your key design decisions and any patterns used.\n\nExample:\nUsed Strategy pattern for SpotAllocationStrategy to allow different allocation algorithms (nearest-first, floor-priority). This allows adding new strategies without modifying the ParkingLot class.',
    required: true,
  },
  {
    key: 'tradeoffs' as const,
    label: 'Trade-offs & Extensibility',
    placeholder:
      'What trade-offs did you make? How would the design handle future changes?\n\nExample:\nChose composition over inheritance for vehicle types because new vehicle types can be added as enum values rather than new subclasses.',
    required: false,
  },
];

export function SubmissionEditor({
  initialContent,
  onSubmit,
  isSubmitting,
  disabled = false,
}: Props) {
  const [content, setContent] = useState<TextSubmissionContent>(
    initialContent || {
      classesAndResponsibilities: '',
      relationships: '',
      designDecisions: '',
      tradeoffs: '',
    }
  );

  const handleChange = (
    key: keyof TextSubmissionContent,
    value: string
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(content);
  };

  const requiredFilled = sections
    .filter((s) => s.required)
    .every((s) => content[s.key]?.trim().length >= 50);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => (
        <div key={section.key}>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            {section.label}
            {section.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={content[section.key]}
            onChange={(e) => handleChange(section.key, e.target.value)}
            placeholder={section.placeholder}
            rows={8}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-y disabled:bg-gray-50 disabled:text-gray-500"
          />
          {section.required && content[section.key]?.trim() && content[section.key].trim().length < 50 && (
            <p className="text-xs text-amber-600 mt-1">
              Please write at least 50 characters ({50 - content[section.key].trim().length} more needed)
            </p>
          )}
        </div>
      ))}

      {!disabled && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={!requiredFilled || isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Evaluating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit for Evaluation
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}

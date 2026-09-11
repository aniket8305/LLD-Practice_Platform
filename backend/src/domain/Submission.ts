import {
  SubmissionFormat,
  TextSubmissionContent,
  ValidationResult,
} from './types.js';

/** Interface for submission content — extensible for future formats */
export interface SubmissionContent {
  /** Get full text representation for evaluators */
  getRawText(): string;
  /** Get named sections for structured evaluation */
  getSections(): Map<string, string>;
  /** Validate that the content meets minimum requirements */
  validate(): ValidationResult;
}

/** Text-based submission content with guided sections */
export class TextContent implements SubmissionContent {
  constructor(private readonly content: TextSubmissionContent) {}

  getRawText(): string {
    const sections = this.getSections();
    return Array.from(sections.entries())
      .map(([name, text]) => `## ${name}\n${text}`)
      .join('\n\n');
  }

  getSections(): Map<string, string> {
    const sections = new Map<string, string>();
    sections.set('Classes & Responsibilities', this.content.classesAndResponsibilities);
    sections.set('Relationships', this.content.relationships);
    sections.set('Design Decisions', this.content.designDecisions);
    sections.set('Trade-offs & Extensibility', this.content.tradeoffs);
    return sections;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.content.classesAndResponsibilities?.trim()) {
      errors.push('Classes & Responsibilities section is required');
    }
    if (!this.content.relationships?.trim()) {
      errors.push('Relationships section is required');
    }
    if (!this.content.designDecisions?.trim()) {
      errors.push('Design Decisions section is required');
    }
    // tradeoffs is optional but encouraged

    // Minimum content length check (at least 50 chars per required section)
    const MIN_LENGTH = 50;
    if (
      this.content.classesAndResponsibilities?.trim().length > 0 &&
      this.content.classesAndResponsibilities.trim().length < MIN_LENGTH
    ) {
      errors.push(
        `Classes & Responsibilities section is too short (min ${MIN_LENGTH} characters)`
      );
    }
    if (
      this.content.relationships?.trim().length > 0 &&
      this.content.relationships.trim().length < MIN_LENGTH
    ) {
      errors.push(
        `Relationships section is too short (min ${MIN_LENGTH} characters)`
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  toJSON(): TextSubmissionContent {
    return { ...this.content };
  }
}

export interface SubmissionData {
  id: string;
  attemptId: string;
  format: SubmissionFormat;
  content: TextSubmissionContent;
  rawText: string;
  submittedAt: Date;
}

/**
 * Submission entity — immutable record of what the learner submitted.
 * Separated from Attempt so that new formats only affect this entity.
 */
export class Submission {
  readonly id: string;
  readonly attemptId: string;
  readonly format: SubmissionFormat;
  private readonly _content: SubmissionContent;
  readonly rawText: string;
  readonly submittedAt: Date;

  constructor(data: SubmissionData) {
    this.id = data.id;
    this.attemptId = data.attemptId;
    this.format = data.format;
    this._content = new TextContent(data.content);
    this.rawText = data.rawText;
    this.submittedAt = data.submittedAt;
  }

  get content(): SubmissionContent {
    return this._content;
  }

  getContentData(): TextSubmissionContent {
    return (this._content as TextContent).toJSON();
  }
}

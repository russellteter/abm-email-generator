/**
 * Zod schemas for email generation API
 *
 * Defines input validation for the /api/generate-emails endpoint
 * and output schemas matching SDR sequence generator v1.4 format.
 */

import { z } from 'zod';

// =============================================================================
// Email Output Schemas (SDR Sequence Format)
// =============================================================================

/**
 * Email angle types for the 3-email sequence
 * - timing: Anchored to current initiative/go-live/project
 * - challenge: Competing pressure/tension they face
 * - outcome: Results from similar organizations
 */
export const EmailAngleSchema = z.enum(['timing', 'challenge', 'outcome']);

/**
 * Single email variant schema
 * Matches SDR sequence output format from abm-sdr-sequence-generator.md
 */
export const EmailVariantSchema = z.object({
  // Format: "{accountIndex}-{contactId}-E{1|2|3}"
  variant_id: z.string().regex(/^\d{3}-[A-Z]+-E[123]$/, 'Invalid variant_id format'),

  // Email position in sequence (1, 2, or 3)
  email_number: z.union([z.literal(1), z.literal(2), z.literal(3)]),

  // Subject line: 5-60 characters, no "Re:" prefix
  subject_line: z.string()
    .min(5, 'Subject too short')
    .max(60, 'Subject too long')
    .refine(s => !s.toLowerCase().startsWith('re:'), 'Subject cannot start with "Re:"'),

  // Email body: minimum 100 chars (validates word count separately)
  body: z.string().min(100, 'Email body too short'),

  // Word count: 150-200 words per SDR v1.4 rules
  word_count: z.number()
    .min(150, 'Word count below minimum (150)')
    .max(200, 'Word count above maximum (200)'),

  // Angle for this email in the sequence
  angle: EmailAngleSchema,
});

/**
 * 3-email sequence schema
 * Contains exactly 3 emails with angles: timing -> challenge -> outcome
 */
export const EmailSequenceSchema = z.array(EmailVariantSchema)
  .length(3, 'Sequence must contain exactly 3 emails')
  .refine(
    (emails) => {
      const angles = emails.map(e => e.angle);
      return angles[0] === 'timing' && angles[1] === 'challenge' && angles[2] === 'outcome';
    },
    'Sequence must follow angle order: timing -> challenge -> outcome'
  );

// =============================================================================
// Request Input Schemas (Lightweight versions of Account/Contact)
// =============================================================================

/**
 * Timing signal information for email personalization
 */
export const TimingSignalSchema = z.object({
  initiative: z.string().describe('Primary EHR training initiative'),
  timing: z.string().describe('Timeline (e.g., "Q1 2026", "ONGOING")'),
  why_class_fits: z.string().optional().describe('Why Class is relevant to this timing'),
});

/**
 * Simplified account input for generation
 * Lightweight version of full Account type - only what's needed for email generation
 */
export const AccountInputSchema = z.object({
  // Required fields - use permissive validation to handle partial data
  index: z.number().min(1).max(999).describe('Account index (001-999)'),
  company_name: z.string().min(1).describe('Organization name'),
  tier: z.string().min(1).describe('Account tier (A+, A, B, etc.)'),
  ehr_system: z.string().min(1).describe('Primary EHR platform (Epic, Cerner, etc.)'),

  // Optional but valuable for personalization
  employee_count: z.number().optional().describe('Total employees'),
  timing_signals: z.string().optional().describe('Raw timing signals text'),
  ehr_go_live_date: z.string().optional().describe('EHR implementation timeline'),
  key_timing_signals: z.string().optional().describe('Key timing signals summary'),

  // Structured timing (preferred if available)
  structured_timing: TimingSignalSchema.optional(),

  // Supporting context
  qualification_summary: z.string().optional(),
  evidence_summary: z.string().optional(),
  news_summary: z.string().optional(),
});

/**
 * Simplified contact input for generation
 * Lightweight version of full Contact type
 *
 * Note: email validation is permissive (accepts any string) because
 * some contacts may have incomplete data. The email is used for
 * personalization context, not for actual sending.
 */
export const ContactInputSchema = z.object({
  // Required fields - min(1) ensures non-empty strings
  contact_id: z.string().min(1).describe('Contact identifier'),
  full_name: z.string().min(1).describe('Contact full name'),
  first_name: z.string().min(1).describe('Contact first name'),
  title: z.string().min(1).describe('Job title'),
  // Email is permissive - accepts any string including empty for incomplete data
  email: z.string().describe('Contact email (permissive for incomplete data)'),

  // Persona classification - allow empty string for missing data
  persona_match: z.string().default('').describe('Persona type (IT/Digital Leader, Clinical/Education Leader, etc.)'),

  // Optional context
  department: z.string().optional(),
  relevance_notes: z.string().optional(),
});

/**
 * Generation configuration overrides
 */
export const GenerationConfigSchema = z.object({
  // Word count bounds (default: 150-200 per v1.4)
  min_words: z.number().min(100).max(250).default(150),
  max_words: z.number().min(150).max(300).default(200),

  // Model configuration
  model: z.string().default('claude-sonnet-4-20250514'),
  temperature: z.number().min(0).max(1).default(0.7),

  // Feature flags
  include_klas_evidence: z.boolean().default(true),
  require_warmth_phrase: z.boolean().default(true), // Required in Email 3
}).optional();

/**
 * Full API request schema for /api/generate-emails
 */
export const GenerateRequestSchema = z.object({
  account: AccountInputSchema,
  contact: ContactInputSchema,
  config: GenerationConfigSchema,
});

// =============================================================================
// Type Exports (via z.infer)
// =============================================================================

export type EmailAngle = z.infer<typeof EmailAngleSchema>;
export type EmailVariant = z.infer<typeof EmailVariantSchema>;
export type EmailSequence = z.infer<typeof EmailSequenceSchema>;
export type TimingSignal = z.infer<typeof TimingSignalSchema>;
export type AccountInput = z.infer<typeof AccountInputSchema>;
export type ContactInput = z.infer<typeof ContactInputSchema>;
export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates a complete generation request
 * Returns parsed data or throws ZodError
 */
export function validateGenerateRequest(data: unknown): GenerateRequest {
  return GenerateRequestSchema.parse(data);
}

/**
 * Validates an email sequence output
 * Returns parsed data or throws ZodError
 */
export function validateEmailSequence(data: unknown): EmailSequence {
  return EmailSequenceSchema.parse(data);
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidateRequest(data: unknown) {
  return GenerateRequestSchema.safeParse(data);
}

export function safeValidateSequence(data: unknown) {
  return EmailSequenceSchema.safeParse(data);
}

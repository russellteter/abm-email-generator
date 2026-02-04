/**
 * Email Generator Module
 *
 * Orchestrates email generation with Claude via Vercel AI SDK.
 * Re-exports schemas, prompts, and validation utilities.
 */

// Re-export schemas
export {
  EmailAngleSchema,
  EmailVariantSchema,
  EmailSequenceSchema,
  TimingSignalSchema,
  AccountInputSchema,
  ContactInputSchema,
  GenerationConfigSchema,
  GenerateRequestSchema,
  validateGenerateRequest,
  validateEmailSequence,
  safeValidateRequest,
  safeValidateSequence,
} from './schemas';

export type {
  EmailAngle,
  EmailVariant,
  EmailSequence,
  TimingSignal,
  AccountInput,
  ContactInput,
  GenerationConfig,
  GenerateRequest,
} from './schemas';

// Re-export prompts
export {
  buildSystemPrompt,
  buildUserPrompt,
  buildTimingContext,
  buildPersonaGuidance,
} from './prompts';

// Re-export validator
export {
  validateEmail,
  validateSequence,
  countWords,
  hasContractionIssues,
  hasValidKlasIntro,
  hasValidWeTiming,
  hasValidCta,
  hasWarmthPhrase,
  hasBannedPhrases,
  hasValidSignature,
} from './validator';

export type { ValidationResult } from './validator';

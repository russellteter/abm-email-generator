/**
 * Email validator with humanization checks
 *
 * Validates generated emails against SDR v1.4 rules including:
 * - Word count (150-200 words)
 * - Contractions usage
 * - KLAS introduction format
 * - "We" timing (only after Class introduced)
 * - CTA patterns (no "20 minutes")
 * - Warmth phrase in Email 3
 */

import type { EmailVariant } from './schemas';

// =============================================================================
// Types
// =============================================================================

export interface ValidationResult {
  /** Overall pass/fail */
  passed: boolean;
  /** Individual check results */
  checks: Record<string, boolean>;
  /** List of failures */
  failures: string[];
  /** Suggestions for fixing failures */
  suggestions: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Count words in text (splits on whitespace)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check for uncontracted phrases that should use contractions
 * Returns true if there are contraction issues (bad)
 */
export function hasContractionIssues(text: string): boolean {
  const uncontractedPatterns = [
    /\bI am\b/i,
    /\bI have\b/i,
    /\bYou are\b/i,
    /\bWe are\b/i,
    /\bThey are\b/i,
    /\bIt is\b/i,
    /\bThat is\b/i,
    /\bWhat is\b/i,
    /\bThere is\b/i,
    /\bHere is\b/i,
    /\bDo not\b/i,
    /\bCan not\b/i,
    /\bWill not\b/i,
    /\bWould not\b/i,
    /\bCould not\b/i,
    /\bShould not\b/i,
  ];

  return uncontractedPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if KLAS is properly introduced with context
 * Returns true if KLAS intro is valid or KLAS not mentioned
 */
export function hasValidKlasIntro(text: string): boolean {
  const lowerText = text.toLowerCase();

  // If KLAS isn't mentioned, no validation needed
  if (!lowerText.includes('klas')) {
    return true;
  }

  // Check for proper introduction patterns
  const validIntros = [
    /klas\s+research[—–-]which\s+surveyed\s+500,?000\+?\s+clinicians/i,
    /klas\s+research,?\s+which\s+surveyed\s+500,?000\+?\s+clinicians/i,
    /according\s+to\s+klas\s+research[—–-]the\s+healthcare/i,
    /surveyed\s+by\s+klas\s+research\s*\(500,?000\+?\s+clinicians/i,
    /from\s+klas\s+research\s*\(500,?000\+?\s+clinicians/i,
    /from\s+klas\s+research\.\s+according\s+to\s+their\s+study\s+of\s+500,?000\+?\s+clinicians/i,
  ];

  // Also allow references after the first mention ("the same KLAS", "the KLAS study")
  // These are only valid if there's also a proper intro
  const hasProperIntro = validIntros.some(pattern => pattern.test(text));

  // If no proper intro, check if it's a bad pattern
  if (!hasProperIntro) {
    const badPatterns = [
      /^[^.]*klas\s+data\s+shows/i,
      /^[^.]*the\s+klas\s+study/i,
      /^[^.]*klas\s+shows/i,
      /^[^.]*klas\s+research\s+shows/i, // Without the "which surveyed" context
    ];

    // Return false if any bad pattern is the first mention
    return !badPatterns.some(pattern => pattern.test(text));
  }

  return hasProperIntro;
}

/**
 * Check if "we" is used only after Class is mentioned
 * Returns true if timing is valid
 */
export function hasValidWeTiming(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Find position of first "class" (as company name, not the word "class" in general)
  // Look for patterns like "Class—", "Class is", "about Class", "using Class"
  const classPatterns = [
    /\babout class[—–\-,.\s]/i,
    /\bclass[—–\-\s]+a\s+virtual/i,
    /\bclass\s+is\s+built/i,
    /\busing class\b/i,
    /\bclass\s+helps\b/i,
    /\bclass\s+provides\b/i,
    /\bclass\s+gives\b/i,
    /\bclass\s+lets\b/i,
    /\bclass\s+turns\b/i,
    /\bclass\s+adds\b/i,
    /\bwith class\b/i,
  ];

  let classPosition = -1;
  for (const pattern of classPatterns) {
    const match = pattern.exec(text);
    if (match && (classPosition === -1 || match.index < classPosition)) {
      classPosition = match.index;
    }
  }

  // If Class is never mentioned, we shouldn't use "we" at all
  // But for flexibility, allow emails that don't use "we"
  const wePattern = /\b(we|we're|we've|we'll|our)\b/gi;
  let match;
  while ((match = wePattern.exec(lowerText)) !== null) {
    // Skip "we" that's part of another word (e.g., "however")
    if (classPosition === -1 || match.index < classPosition) {
      // "we" appears before Class is mentioned
      return false;
    }
  }

  return true;
}

/**
 * Check if CTA follows allowed patterns
 * Returns true if CTA is valid
 */
export function hasValidCta(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Banned CTA patterns
  const bannedPatterns = [
    /20\s*minutes?/i,
    /15\s*minutes?/i,
    /does\s+(monday|tuesday|wednesday|thursday|friday)\s+work/i,
    /would\s+(monday|tuesday|wednesday|thursday|friday)\s+work/i,
    /can\s+we\s+schedule/i,
    /i\s+genuinely\s+don't\s+know\s+if\s+class\s+is\s+right/i,
    /happy\s+to\s+share\s+over\s+email\s+if\s+easier/i,
    /no\s+meeting\s+required/i,
  ];

  return !bannedPatterns.some(pattern => pattern.test(lowerText));
}

/**
 * Check if Email 3 has a warmth phrase
 * Returns true if warmth phrase is present or not required (not Email 3)
 */
export function hasWarmthPhrase(text: string, emailNumber: number): boolean {
  // Warmth phrase only required for Email 3
  if (emailNumber !== 3) {
    return true;
  }

  const lowerText = text.toLowerCase();

  // Warmth phrase patterns
  const warmthPatterns = [
    /even\s+if\s+(the\s+)?timing\s+isn't\s+right/i,
    /even\s+if\s+class\s+isn't\s+the\s+right\s+solution/i,
    /even\s+if\s+now\s+isn't\s+the\s+right\s+time/i,
    /i\s+hope\s+this\s+data\s+is\s+useful/i,
    /i\s+hope\s+these\s+findings\s+are\s+useful/i,
    /the\s+klas\s+research\s+might\s+be\s+useful/i,
    /this\s+research\s+might\s+be\s+useful/i,
    /i\s+appreciate\s+you're\s+managing\s+a\s+lot/i,
    /these\s+findings\s+will\s+still\s+be\s+relevant/i,
  ];

  return warmthPatterns.some(pattern => pattern.test(lowerText));
}

/**
 * Check for banned phrases that indicate poor quality
 */
export function hasBannedPhrases(text: string): string[] {
  const bannedPhrases: Array<{ pattern: RegExp; description: string }> = [
    { pattern: /competency\s+verification/i, description: 'Use "embedded assessments" instead of "competency verification"' },
    { pattern: /hands-?on\s+ehr\s+practice\s+environment/i, description: 'Class is not an EHR simulator' },
    { pattern: /single\s+dashboard\s+across\s+your\s+entire\s+network/i, description: 'Overstated feature claim' },
    { pattern: /no\s+new\s+infrastructure\s+to\s+learn/i, description: 'Users need Class training' },
    { pattern: /deployment\s+layer/i, description: 'Confusing terminology' },
    { pattern: /overwhelming\s+the\s+education\s+infrastructure/i, description: 'Vague wording' },
    { pattern: /one\s+more\s+thought/i, description: 'Feels pestering' },
    { pattern: /i\s+keep\s+wondering/i, description: 'Forced personalization' },
    { pattern: /january\s+sessions?/i, description: 'Too immediate timing reference' },
    { pattern: /runs?\s+on\s+your\s+existing\s+zoom/i, description: 'Use "built for Zoom" instead' },
  ];

  const found: string[] = [];
  for (const { pattern, description } of bannedPhrases) {
    if (pattern.test(text)) {
      found.push(description);
    }
  }

  return found;
}

/**
 * Check if email is signed correctly
 */
export function hasValidSignature(text: string): boolean {
  const lines = text.trim().split('\n');
  const lastLine = lines[lines.length - 1].trim();
  return lastLine.toLowerCase() === 'dalton';
}

// =============================================================================
// Main Validator
// =============================================================================

/**
 * Validate a single email against SDR v1.4 rules
 */
export function validateEmail(email: EmailVariant): ValidationResult {
  const checks: Record<string, boolean> = {};
  const failures: string[] = [];
  const suggestions: string[] = [];

  // 1. Word count validation
  const wordCount = countWords(email.body);
  checks['word_count_valid'] = wordCount >= 150 && wordCount <= 200;
  if (!checks['word_count_valid']) {
    failures.push(`Word count ${wordCount} outside range 150-200`);
    if (wordCount < 150) {
      suggestions.push(`Add ${150 - wordCount} more words to meet minimum`);
    } else {
      suggestions.push(`Remove ${wordCount - 200} words to meet maximum`);
    }
  }

  // 2. Contractions check
  checks['contractions_used'] = !hasContractionIssues(email.body);
  if (!checks['contractions_used']) {
    failures.push('Uncontracted phrases detected (e.g., "I am" instead of "I\'m")');
    suggestions.push('Use contractions: I\'m, you\'re, that\'s, it\'s, can\'t, won\'t, don\'t');
  }

  // 3. KLAS introduction check
  checks['klas_intro_valid'] = hasValidKlasIntro(email.body);
  if (!checks['klas_intro_valid']) {
    failures.push('KLAS mentioned without proper introduction');
    suggestions.push('First KLAS mention must include: "KLAS Research—which surveyed 500,000+ clinicians across 300 healthcare organizations—found that..."');
  }

  // 4. "We" timing check
  checks['we_timing_valid'] = hasValidWeTiming(email.body);
  if (!checks['we_timing_valid']) {
    failures.push('"We" used before Class was introduced');
    suggestions.push('Introduce Class by name before using "we": "That\'s why I\'m reaching out about Class—a virtual classroom platform. The challenge we hear..."');
  }

  // 5. CTA validation
  checks['cta_valid'] = hasValidCta(email.body);
  if (!checks['cta_valid']) {
    failures.push('CTA contains banned patterns (e.g., "20 minutes", specific day/time)');
    suggestions.push('Use conversational CTAs: "Is it worth a quick conversation? Let me know when works best for you."');
  }

  // 6. Warmth phrase (Email 3 only)
  checks['warmth_phrase_valid'] = hasWarmthPhrase(email.body, email.email_number);
  if (!checks['warmth_phrase_valid']) {
    failures.push('Email 3 missing warmth phrase');
    suggestions.push('Add warmth phrase: "Even if the timing isn\'t right over the next few months, I hope these findings are useful context for your planning."');
  }

  // 7. Banned phrases check
  const bannedFound = hasBannedPhrases(email.body);
  checks['no_banned_phrases'] = bannedFound.length === 0;
  if (!checks['no_banned_phrases']) {
    failures.push(`Banned phrases found: ${bannedFound.length}`);
    suggestions.push(...bannedFound);
  }

  // 8. Signature check
  checks['signature_valid'] = hasValidSignature(email.body);
  if (!checks['signature_valid']) {
    failures.push('Email not signed "Dalton" on last line');
    suggestions.push('End email with just "Dalton" (first name only)');
  }

  // 9. Subject line check (no "Re:")
  checks['subject_valid'] = !email.subject_line.toLowerCase().startsWith('re:');
  if (!checks['subject_valid']) {
    failures.push('Subject line starts with "Re:"');
    suggestions.push('Each email needs a unique subject line, no "Re:" prefix');
  }

  return {
    passed: failures.length === 0,
    checks,
    failures,
    suggestions,
  };
}

/**
 * Validate an entire 3-email sequence
 */
export function validateSequence(emails: EmailVariant[]): ValidationResult {
  const allChecks: Record<string, boolean> = {};
  const allFailures: string[] = [];
  const allSuggestions: string[] = [];

  // Validate sequence length
  if (emails.length !== 3) {
    allFailures.push(`Sequence has ${emails.length} emails, expected 3`);
    allSuggestions.push('Generate exactly 3 emails per sequence');
  }

  // Validate angle order
  const expectedAngles = ['timing', 'challenge', 'outcome'];
  const actualAngles = emails.map(e => e.angle);
  const angleOrderValid = actualAngles.every((a, i) => a === expectedAngles[i]);
  allChecks['angle_order_valid'] = angleOrderValid;
  if (!angleOrderValid) {
    allFailures.push(`Angle order incorrect: expected timing->challenge->outcome, got ${actualAngles.join('->')}`);
    allSuggestions.push('Emails must follow angle order: E1=timing, E2=challenge, E3=outcome');
  }

  // Validate each email
  for (const email of emails) {
    const result = validateEmail(email);
    for (const [key, value] of Object.entries(result.checks)) {
      allChecks[`E${email.email_number}_${key}`] = value;
    }
    if (!result.passed) {
      allFailures.push(`Email ${email.email_number}: ${result.failures.join('; ')}`);
      allSuggestions.push(...result.suggestions.map(s => `E${email.email_number}: ${s}`));
    }
  }

  return {
    passed: allFailures.length === 0,
    checks: allChecks,
    failures: allFailures,
    suggestions: allSuggestions,
  };
}

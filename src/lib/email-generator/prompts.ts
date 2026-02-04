/**
 * Prompt builder for SDR email sequence generation
 *
 * Encodes SDR v1.4 rules into system and user prompts for Claude.
 * Rules: 150-200 words, KLAS intro required, "we" timing, verified features only.
 */

import type { AccountInput, ContactInput } from './schemas';

// =============================================================================
// System Prompt (Static SDR v1.4 Rules)
// =============================================================================

/**
 * Builds the static system prompt with all SDR v1.4 rules encoded
 * Kept under 4K tokens by summarizing rules concisely
 */
export function buildSystemPrompt(): string {
  return `You are an expert SDR email writer for Class Technologies, a virtual classroom platform built for Zoom and Microsoft Teams.

## YOUR ROLE
Generate 3-email sequences for healthcare accounts with EHR training needs. Each email uses a different angle while maintaining curiosity, insight, and a soft ask.

## CRITICAL RULES (Non-Negotiable)

### Word Count
- Target: 150-200 words per email
- Never go below 150 or above 200

### KLAS Research Introduction (MANDATORY)
First mention of KLAS in ANY email MUST include full context:
- CORRECT: "KLAS Research—which surveyed 500,000+ clinicians across 300 healthcare organizations—found that..."
- WRONG: "KLAS data shows..." or "the KLAS study..."
Subsequent mentions in same email can be shorter: "The same KLAS research shows..."

### "We" Timing Rule
"We" refers to Class. NEVER use "we" until Class has been introduced by name.
- WRONG: "The challenge we hear from health systems..."
- CORRECT: "That's why I'm reaching out about Class—a virtual classroom platform. The challenge we hear..."
Order: 1) Identify their challenge (use "you"), 2) Introduce Class by name, 3) THEN use "we"

### Verified Features ONLY
Safe claims:
- "Class is built for Zoom or Microsoft Teams"
- "Real-time engagement tracking during sessions"
- "Enhanced breakout rooms where instructors can see all groups at once"
- "Embedded assessments and quizzes to check understanding"
- "HIPAA-certified platform"
- "Integrates with major LMS platforms"

BANNED claims:
- "Competency verification" (use "embedded assessments" instead)
- "Hands-on EHR practice environment" (Class is NOT an EHR simulator)
- "Single dashboard across your entire network" (overstated)
- "No new infrastructure to learn" (users need Class training)

### CTA Patterns (No "20 Minutes")
CORRECT CTAs:
- "Is it worth a quick conversation to see how teams are using Class for [use case]? Let me know when works best for you."
- "Would it help to see how this works in practice? Happy to walk through a demo whenever timing makes sense."
- "Let me know when works best, or feel free to connect with our solutions team anytime."

BANNED CTAs:
- "Does Tuesday work for 20 minutes?"
- "Would a 20-minute demo be useful?"
- Any specific day/time in cold outreach
- "I genuinely don't know if Class is right" (self-deprecating)

### Timing References
Use "2026" or "over the next few months"—NOT immediate dates like "January sessions"

### Warmth Phrase (Required in Email 3)
Include before final CTA:
- "Even if the timing isn't right over the next few months, I hope these findings are useful context for your planning."
- "Even if Class isn't the right solution right now, the KLAS research might be useful for your team's evaluation."

## SDR VOICE (Dalton Mullins)
- Signature: "Dalton" (first name only)
- Tone: Conversational, warm, uses contractions aggressively
- Use: I'm, you're, that's, it's, can't, won't, don't
- Include 2-3 questions per email
- Start sentences with "And" or "But" for rhythm
- NEVER: "I am curious" (say "I'm curious" or just ask)

## 3-EMAIL SEQUENCE STRUCTURE

### Email 1: Timing Signal Angle
- Lead with their current initiative/go-live/timing
- Opening question tied to timing signal
- Introduce Class by name before using "we"
- Curiosity-based CTA

### Email 2: Challenge/Tension Angle
- "Following up..." transition
- Challenge statement (competing pressure they face)
- KLAS quote/evidence WITH proper introduction
- Solution bridge showing how Class addresses tension
- "Compare notes?" CTA

### Email 3: Outcome/Proof Angle
- "Wanted to share specific results..." opener
- KLAS proof point WITH proper introduction
- Clinician quote (clearly attributed to KLAS)
- REQUIRED warmth phrase
- Direct CTA with solutions team option

## OUTPUT FORMAT
Return a valid JSON array with exactly 3 email objects:
[
  {
    "variant_id": "{accountIndex}-{contactId}-E1",
    "email_number": 1,
    "subject_line": "Subject here (5-60 chars, no Re:)",
    "body": "Full email body...",
    "word_count": 175,
    "angle": "timing"
  },
  {
    "variant_id": "{accountIndex}-{contactId}-E2",
    "email_number": 2,
    "subject_line": "Subject here",
    "body": "Full email body...",
    "word_count": 165,
    "angle": "challenge"
  },
  {
    "variant_id": "{accountIndex}-{contactId}-E3",
    "email_number": 3,
    "subject_line": "Subject here",
    "body": "Full email body with warmth phrase...",
    "word_count": 185,
    "angle": "outcome"
  }
]

## QUALITY CHECKLIST (Every Email)
- [ ] Word count 150-200
- [ ] KLAS properly introduced on first mention
- [ ] "We" only used AFTER Class introduced
- [ ] 2-3 questions present
- [ ] Contractions used throughout
- [ ] Solution bridge with verified features only
- [ ] CTA is conversational (no "20 minutes")
- [ ] Signed "Dalton"
- [ ] Email 3 has warmth phrase`;
}

// =============================================================================
// User Prompt (Dynamic Account/Contact Context)
// =============================================================================

/**
 * Builds the dynamic user prompt with account and contact context
 */
export function buildUserPrompt(account: AccountInput, contact: ContactInput): string {
  // Format account index as 3-digit string
  const accountIndex = String(account.index).padStart(3, '0');

  // Extract contact ID letter (e.g., "A" from "JOHN-A")
  const contactIdSuffix = contact.contact_id.split('-').pop() || 'A';

  // Build timing context section
  const timingContext = buildTimingContext(account);

  // Build persona guidance
  const personaGuidance = buildPersonaGuidance(contact.persona_match);

  return `## GENERATE 3-EMAIL SDR SEQUENCE

### Account Context
**Company:** ${account.company_name}
**Tier:** ${account.tier}
**EHR System:** ${account.ehr_system}
${account.employee_count ? `**Employees:** ${account.employee_count.toLocaleString()}` : ''}
${account.ehr_go_live_date ? `**EHR Timeline:** ${account.ehr_go_live_date}` : ''}

${timingContext}

### Contact Context
**Name:** ${contact.full_name} (First name: ${contact.first_name})
**Title:** ${contact.title}
**Email:** ${contact.email}
**Persona:** ${contact.persona_match}
${contact.department ? `**Department:** ${contact.department}` : ''}
${contact.relevance_notes ? `**Notes:** ${contact.relevance_notes}` : ''}

${personaGuidance}

### Output Requirements
- variant_id format: "${accountIndex}-${contactIdSuffix}-E{1|2|3}"
- Address recipient as "${contact.first_name}" (first name)
- Sign all emails as "Dalton"
- Follow angle sequence: timing -> challenge -> outcome
- Each email: 150-200 words
- Include warmth phrase in Email 3

Generate the 3-email JSON sequence now.`;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Builds timing context section from account data
 */
function buildTimingContext(account: AccountInput): string {
  const sections: string[] = [];

  // Use structured timing if available
  if (account.structured_timing) {
    const st = account.structured_timing;
    sections.push(`### EHR Training Initiative`);
    sections.push(`**Initiative:** ${st.initiative}`);
    sections.push(`**Timing:** ${st.timing}`);
    if (st.why_class_fits) {
      sections.push(`**Why Class Fits:** ${st.why_class_fits}`);
    }
  } else {
    // Fall back to raw timing signals
    sections.push(`### Timing Signals`);
    if (account.key_timing_signals) {
      sections.push(`**Key Signals:** ${account.key_timing_signals}`);
    }
    if (account.timing_signals) {
      sections.push(`**Raw Signals:** ${account.timing_signals}`);
    }
  }

  // Add supporting context
  if (account.qualification_summary) {
    sections.push(`\n### Qualification Summary`);
    sections.push(account.qualification_summary);
  }

  if (account.evidence_summary) {
    sections.push(`\n### Evidence Summary`);
    sections.push(account.evidence_summary);
  }

  if (account.news_summary) {
    sections.push(`\n### Recent News`);
    sections.push(account.news_summary);
  }

  return sections.join('\n');
}

/**
 * Builds persona-specific guidance based on contact type
 */
function buildPersonaGuidance(personaMatch: string): string {
  const persona = personaMatch.toLowerCase();

  if (persona.includes('it') || persona.includes('digital') || persona.includes('informatics')) {
    return `### Persona Guidance: IT/Digital Leader
- Focus on: infrastructure, deployment, integration, ROI, scale, velocity
- Pain points: integration complexity, trainer bandwidth, deployment speed
- Language: system-level, vendor evaluation, budget, timelines`;
  }

  if (persona.includes('clinical') || persona.includes('education') || persona.includes('nursing')) {
    return `### Persona Guidance: Clinical/Education Leader
- Focus on: floor time, proficiency, hands-on practice, patient care, clinical burden
- Pain points: time away from patients, training verification, adoption rates
- Language: staff time, training quality, clinician satisfaction`;
  }

  // Default guidance for mixed/unknown personas
  return `### Persona Guidance: General Healthcare Leader
- Balance operational and clinical concerns
- Focus on scalability and quality of training
- Emphasize time savings and engagement benefits`;
}

// =============================================================================
// Exports for testing/validation
// =============================================================================

export { buildTimingContext, buildPersonaGuidance };

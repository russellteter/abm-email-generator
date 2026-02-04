/**
 * Email Storage API - List and Create
 *
 * GET /api/emails - List all saved emails (with optional ?accountIndex=N filter)
 * POST /api/emails - Save a new email sequence
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveEmail, listEmails } from '@/lib/storage';

// Permissive email variant schema for saving (emails already validated during generation)
const SavedEmailVariantSchema = z.object({
  variant_id: z.string().min(1),
  email_number: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  subject_line: z.string().min(1),
  body: z.string().min(1),
  word_count: z.number().int().min(1),
  angle: z.enum(['timing', 'challenge', 'outcome']),
});

// Zod schema for POST request body
const SaveEmailRequestSchema = z.object({
  accountIndex: z.number().int().min(1),
  accountName: z.string().min(1),
  contactId: z.string().min(1),
  contactName: z.string().min(1),
  contactTitle: z.string(),
  emails: z.array(SavedEmailVariantSchema).length(3),
});

/**
 * GET /api/emails
 * List all saved emails, optionally filtered by account
 *
 * Query params:
 *   - accountIndex: (optional) Filter by account index
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountIndexParam = url.searchParams.get('accountIndex');

  // Parse optional accountIndex filter
  let accountIndex: number | undefined;
  if (accountIndexParam !== null) {
    const parsed = parseInt(accountIndexParam, 10);
    if (isNaN(parsed) || parsed < 1) {
      return NextResponse.json(
        { error: 'Invalid accountIndex parameter' },
        { status: 400 }
      );
    }
    accountIndex = parsed;
  }

  const emails = listEmails(accountIndex);
  return NextResponse.json(emails);
}

/**
 * POST /api/emails
 * Save a new email sequence
 *
 * Request body:
 *   - accountIndex: number
 *   - accountName: string
 *   - contactId: string
 *   - contactName: string
 *   - contactTitle: string
 *   - emails: EmailSequence (array of 3 emails)
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  // Validate request body
  const result = SaveEmailRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Save email sequence
  const saved = saveEmail(result.data);

  return NextResponse.json(saved, { status: 201 });
}

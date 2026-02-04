/**
 * Email Storage API - Get and Delete by ID
 *
 * GET /api/emails/[id] - Retrieve a saved email by ID
 * DELETE /api/emails/[id] - Delete a saved email by ID
 */

import { NextResponse } from 'next/server';
import { getEmail, deleteEmail } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/emails/[id]
 * Retrieve a single saved email by ID
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Missing email ID' },
      { status: 400 }
    );
  }

  const email = getEmail(id);

  if (!email) {
    return NextResponse.json(
      { error: 'Email not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(email);
}

/**
 * DELETE /api/emails/[id]
 * Delete a saved email by ID
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Missing email ID' },
      { status: 400 }
    );
  }

  const deleted = deleteEmail(id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Email not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, id });
}

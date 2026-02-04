import { NextResponse } from 'next/server';
import { getContactListItems, loadContactsForAccount } from '@/lib/data';

interface RouteParams {
  params: Promise<{ accountIndex: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { accountIndex } = await params;
  const index = parseInt(accountIndex, 10);

  if (isNaN(index) || index < 1) {
    return NextResponse.json(
      { error: 'Invalid account index' },
      { status: 400 }
    );
  }

  // Check for full=true query param
  const url = new URL(request.url);
  const full = url.searchParams.get('full') === 'true';

  if (full) {
    // Return full contact data for email generation
    const contacts = await loadContactsForAccount(index);
    return NextResponse.json(contacts);
  }

  // Return list items for selector
  const contacts = await getContactListItems(index);
  return NextResponse.json(contacts);
}

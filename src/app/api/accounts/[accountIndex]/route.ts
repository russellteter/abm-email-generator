import { NextResponse } from 'next/server';
import { loadAccount } from '@/lib/data';

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

  const account = await loadAccount(index);

  if (!account) {
    return NextResponse.json(
      { error: 'Account not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(account);
}

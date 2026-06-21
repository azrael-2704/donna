import { NextRequest, NextResponse } from 'next/server';
import { getGroupedLogs } from '@/lib/telemetry';

export async function GET(request: NextRequest) {
  try {
    const logs = getGroupedLogs();
    return NextResponse.json({ success: true, sessions: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

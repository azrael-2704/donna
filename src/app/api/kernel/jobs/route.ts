import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/kernel/scheduler';

export async function GET() {
  try {
    const jobs = listJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

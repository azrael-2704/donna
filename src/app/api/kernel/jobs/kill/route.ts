import { NextRequest, NextResponse } from 'next/server';
import { killJob } from '@/lib/kernel/scheduler';
import { logEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const success = killJob(jobId);

    logEvent({
      sessionId: 'system',
      msgId: `kill_${Date.now()}`,
      agent: 'ORCHESTRATOR',
      action: 'KILL_JOB',
      success: success,
      input: { jobId },
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Job not found or could not be killed' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { saveAndScheduleJob } from '@/lib/kernel/scheduler';
import { logEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, type, cronSchedule, sessionId, msgId } = body;

    if (!code || !type || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sId = sessionId || 'session-unknown';
    const mId = msgId || 'msg-unknown';

    const job = saveAndScheduleJob(code, name, type, cronSchedule);

    logEvent({
      sessionId: sId,
      msgId: mId,
      agent: 'ORCHESTRATOR',
      action: 'SCHEDULE_JOB',
      success: true,
      input: { type, cronSchedule, name },
      output: { jobId: job.id, scriptPath: job.scriptPath },
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

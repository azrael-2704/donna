import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { executeScript } from '@/lib/kernel/sandbox';

export async function POST(request: NextRequest) {
  try {
    // Basic security check (in production, use a secure CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch all scripts that are marked 'running' and have a schedule_cron
    // In a real robust system, we would parse the cron expression and check if it's due.
    // For MVP, we'll assume this endpoint is hit by an external cron matching the schedule,
    // or we'll just run all active background scripts for demonstration.
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('status', 'running')
      .not('schedule_cron', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];

    for (const script of scripts) {
      // Execute each script
      const envVars: Record<string, string> = process.env.GEMINI_API_KEY 
        ? { GEMINI_API_KEY: process.env.GEMINI_API_KEY } 
        : {};

      const result = await executeScript(script.code, envVars);

      // Log execution
      await supabase.from('script_logs').insert({
        script_id: script.id,
        user_id: script.user_id,
        status: result.success ? 'success' : 'error',
        output: result.output,
        error_trace: result.error || null,
        duration_ms: result.durationMs,
      });

      // Update script
      await supabase
        .from('scripts')
        .update({
          last_run_at: new Date().toISOString(),
          last_error: result.error || null,
          run_count: script.run_count + 1,
          status: result.success ? 'running' : 'failed' // keep running if success, pause if failed
        })
        .eq('id', script.id);

      results.push({
        script_id: script.id,
        name: script.name,
        success: result.success,
      });
    }

    return NextResponse.json({
      message: `Processed ${scripts.length} scheduled scripts`,
      results,
    });
  } catch (err: any) {
    console.error('[kernel/schedule] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { executeScript } from '@/lib/kernel/sandbox';
import { logEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script_id, user_id, manual_code, sessionId, msgId } = body;

    let codeToExecute = manual_code;
    let userId = user_id;
    let supabase: any = null;

    const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (script_id && !codeToExecute && hasSupabaseEnv) {
      supabase = createAdminClient();
      const { data: script, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', script_id)
        .single();

      if (error || !script) {
        return NextResponse.json({ error: 'Script not found' }, { status: 404 });
      }

      if (script.status !== 'approved') {
        return NextResponse.json({ error: 'Script has not been approved for execution' }, { status: 403 });
      }
      
      codeToExecute = script.code;
    }

    if (!codeToExecute) {
      return NextResponse.json({ error: 'No code to execute' }, { status: 400 });
    }

    // Fetch env vars (secrets)
    let envVars = {};
    if (user_id && hasSupabaseEnv && supabase) {
       // Placeholder: Fetch secrets from vault
    }

    // Execute the code
    const result = await executeScript(codeToExecute, envVars);

    const sId = sessionId || 'session-unknown';
    const mId = msgId || 'msg-unknown';

    logEvent({
      sessionId: sId,
      msgId: mId,
      agent: 'SANDBOX',
      action: 'EXECUTE',
      success: result.success,
      output: { 
        durationMs: result.durationMs, 
        error: result.error, 
        outputLength: result.output.length 
      },
      metadata: result.metadata,
    });

    // If script_id is provided, log the result
    if (script_id && hasSupabaseEnv && supabase) {
      try {
        await supabase.from('script_logs').insert({
          script_id,
          user_id: userId,
          status: result.success ? 'success' : 'error',
          output: result.output,
          error_trace: result.error || null,
          duration_ms: result.durationMs,
        });

        // Update script status and run_count
        const { data: currentScript } = await supabase
          .from('scripts')
          .select('run_count')
          .eq('id', script_id)
          .single();

        await supabase
          .from('scripts')
          .update({
            status: result.success ? 'completed' : 'failed',
            last_error: result.error || null,
            run_count: (currentScript?.run_count || 0) + 1,
          })
          .eq('id', script_id);
      } catch (dbErr) {
        console.error('Supabase save log failed:', dbErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
    });
  } catch (err: any) {
    console.error('[kernel/execute] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

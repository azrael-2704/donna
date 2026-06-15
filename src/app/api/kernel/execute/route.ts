import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { executeScript } from '@/lib/kernel/sandbox';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script_id, user_id, manual_code } = body;

    let codeToExecute = manual_code;
    let userId = user_id;
    let supabase: any = null;

    // If a script_id is provided, fetch it from the database
    if (script_id) {
      supabase = createAdminClient();
      const { data: script, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', script_id)
        .single();

      if (error || !script) {
        return NextResponse.json({ error: 'Script not found' }, { status: 404 });
      }

      codeToExecute = script.code;
      userId = script.user_id;

      // Mark script as running
      await supabase
        .from('scripts')
        .update({ status: 'running', last_run_at: new Date().toISOString() })
        .eq('id', script_id);
    }

    if (!codeToExecute) {
      return NextResponse.json({ error: 'No code to execute' }, { status: 400 });
    }

    // Prepare environment variables (e.g., fetch integration credentials)
    // For MVP, we'll just pass GEMINI_API_KEY if present
    const envVars: Record<string, string> = {};
    if (process.env.GEMINI_API_KEY) {
      envVars.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    }
    
    // In v1, we would fetch vaulted credentials here:
    // const { data: creds } = await supabase.from('integration_credentials').eq('user_id', userId);
    // creds.forEach(c => envVars[`API_KEY_${c.service.toUpperCase()}`] = decrypt(c.credentials_encrypted));

    // Execute the code
    const result = await executeScript(codeToExecute, envVars);

    // If script_id is provided, log the result
    if (script_id) {
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

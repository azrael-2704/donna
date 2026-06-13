import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { healScript } from '@/lib/kernel/healer';
import { auditScript } from '@/lib/kernel/auditor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script_id } = body;

    if (!script_id) {
      return NextResponse.json({ error: 'Missing script_id' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // Fetch script and the last error log
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', script_id)
      .single();

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (script.status !== 'failed' || !script.last_error) {
      return NextResponse.json({ error: 'Script is not in a failed state or lacks an error trace' }, { status: 400 });
    }

    // Step 1: Heal the code using Gemini
    const newCode = await healScript({
      code: script.code,
      errorTrace: script.last_error,
      apiKey,
    });

    // Step 2: Audit the patched code
    const auditResult = await auditScript({
      code: newCode,
      apiKey,
    });

    // Step 3: Update database
    const { data: updatedScript, error: updateError } = await supabase
      .from('scripts')
      .update({
        code: newCode,
        status: auditResult.approved ? 'approved' : 'auditing', // If it failed audit, mark for manual review
      })
      .eq('id', script_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      script: updatedScript,
      audit: auditResult,
    });
  } catch (err: any) {
    console.error('[kernel/heal] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

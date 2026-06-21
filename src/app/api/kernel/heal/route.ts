import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { healScript } from '@/lib/kernel/healer';
import { auditScript } from '@/lib/kernel/auditor';
import { logEvent } from '@/lib/telemetry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script_id, code, errorTrace, sessionId, msgId } = body;

    let currentCode = code;
    let currentError = errorTrace;

    const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    let supabase: any = null;

    if (script_id && hasSupabaseEnv) {
      supabase = createAdminClient();
      const { data: script, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', script_id)
        .single();
      
      if (!scriptError && script) {
        currentCode = script.code;
        currentError = script.last_error || errorTrace;
      }
    }

    if (!currentCode || !currentError) {
      return NextResponse.json({ error: 'Missing code or error trace for healing' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    // Step 1: Heal the code using Gemini
    const healResult = await healScript({
      code: currentCode,
      errorTrace: currentError,
      apiKey,
    });
    const newCode = healResult.code;

    // Step 2: Audit the patched code
    const auditResult = await auditScript({
      code: newCode,
      apiKey,
    });

    const sId = sessionId || 'session-unknown';
    const mId = msgId || 'msg-unknown';

    logEvent({
      sessionId: sId,
      msgId: mId,
      agent: 'HEALER',
      action: 'HEAL',
      success: true,
      input: { error: currentError },
      output: { code: newCode },
      metadata: healResult.usage ? { ioTokens: healResult.usage } : undefined,
    });

    logEvent({
      sessionId: sId,
      msgId: mId,
      agent: 'AUDITOR',
      action: 'AUDIT',
      success: auditResult.approved,
      reasoning: auditResult.reason,
      output: { riskLevel: auditResult.riskLevel, blockedFunctions: auditResult.blockedFunctions },
      metadata: auditResult._usage ? { ioTokens: auditResult._usage } : undefined,
    });

    // Step 3: Update database (Optional)
    let updatedScript = null;
    if (script_id && hasSupabaseEnv && supabase) {
      const { data, error: updateError } = await supabase
        .from('scripts')
        .update({
          code: newCode,
          status: auditResult.approved ? 'approved' : 'auditing', 
        })
        .eq('id', script_id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Failed to update script in DB:', updateError);
      } else if (data) {
        updatedScript = data;
      }
    }

    return NextResponse.json({
      success: true,
      script: updatedScript,
      code: newCode,
      audit: auditResult,
    });
  } catch (err: any) {
    console.error('[kernel/heal] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

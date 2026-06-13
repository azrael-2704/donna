import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { synthesizeScript } from '@/lib/kernel/coder';
import { auditScript } from '@/lib/kernel/auditor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, user_id, name, description, context } = body;

    if (!instruction || !user_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: instruction, user_id, name' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    // Step 1: Synthesize the Python code
    const code = await synthesizeScript({
      instruction,
      context,
      apiKey,
    });

    // Step 2: Audit the code
    const auditResult = await auditScript({
      code,
      apiKey,
    });

    const supabase = createAdminClient();

    // Step 3: Save to Database
    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        user_id,
        name,
        description: description || instruction,
        code,
        language: 'python',
        status: auditResult.approved ? 'approved' : 'draft', // Or 'failed' depending on policy
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      script,
      audit: auditResult,
    });
  } catch (err: any) {
    console.error('[kernel/synthesize] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

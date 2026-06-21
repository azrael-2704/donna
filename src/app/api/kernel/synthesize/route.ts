import { NextRequest, NextResponse } from 'next/server';
import { synthesizeScript } from '@/lib/kernel/coder';
import { auditScript } from '@/lib/kernel/auditor';
import { logEvent } from '@/lib/telemetry';
import { routeIntent } from '@/lib/kernel/router';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, user_id, name, description, context, sessionId, msgId } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: 'Missing instruction' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    // Read Donna Memory (DDS Format)
    let memoryContext = '';
    try {
      const memoryDir = path.join(process.cwd(), '.donna', 'memory');
      if (fs.existsSync(memoryDir)) {
        const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(memoryDir, file), 'utf-8');
          memoryContext += `\n--- Memory: ${file} ---\n${content}\n`;
        }
      }
    } catch (e) {
      console.error('Failed to read memory', e);
    }

    const finalContext = context ? `${memoryContext}\n\nAdditional Context:\n${context}` : memoryContext;

    // Step 0: Fast-Path Intent Routing
    let result: any = routeIntent(instruction);
    let auditResult: any = null;

    if (result) {
      // Native skill matched! Skip LLM and skip Auditor since it's pre-approved.
      auditResult = {
        approved: true,
        riskLevel: 'LOW',
        reason: 'Pre-audited Native OS Skill.',
        blockedFunctions: [],
      };
    } else {
      // Step 1: Synthesize the code via LLM
      result = await synthesizeScript({
        instruction,
        context: finalContext,
        model: 'gemini-3.5-flash',
        apiKey,
      });

      // Step 2: Audit the LLM code
      auditResult = await auditScript({
        code: result.code,
        apiKey,
      });
    }

    const code = result.code;
    const execution_type = result.execution_type;
    const cron_schedule = result.cron_schedule;

    const sId = sessionId || 'session-unknown';
    const mId = msgId || 'msg-unknown';

    logEvent({
      sessionId: sId,
      msgId: mId,
      agent: 'CODER',
      action: 'SYNTHESIZE',
      success: true,
      input: { instruction, name },
      output: result,
      reasoning: result.reasoning,
      metadata: result._usage ? { ioTokens: result._usage } : undefined,
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

    let script: any = {
      code,
      name,
      language: 'python',
      status: auditResult.approved ? 'approved' : 'draft',
    };

    // Step 3: Save to Database (Moved to Firestore in another context if needed)

    return NextResponse.json({
      success: true,
      script,
      code,
      execution_type,
      cron_schedule,
      audit: auditResult,
    });
  } catch (err: any) {
    console.error('[kernel/synthesize] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

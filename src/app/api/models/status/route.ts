import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/os/vault';

export async function GET() {
  try {
    // In production, we check the Vault. For V0/local, we also fallback to process.env.
    // The getSecret utility usually wraps this logic.
    
    // Check Google AI
    const hasGoogle = !!(process.env.GEMINI_API_KEY || getSecret('GEMINI_API_KEY'));
    
    // Check OpenAI
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || getSecret('OPENAI_API_KEY'));
    
    // Check Anthropic
    const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || getSecret('ANTHROPIC_API_KEY'));

    return NextResponse.json({
      providers: {
        'Google AI': hasGoogle,
        'OpenAI': hasOpenAI,
        'Anthropic': hasAnthropic,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('[models/status] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider status' }, { status: 500 });
  }
}

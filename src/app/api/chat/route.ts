import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AgentAction } from '@/lib/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const DONNA_SYSTEM_PROMPT = `You are Donna, a premium AI executive coach and personal automation system built into Donna OS.

Core personality:
• You are concise, warm but professional — like a trusted advisor who genuinely cares about the user's success.
• You speak in confident, action-oriented language. No filler phrases.
• You address the user directly and personally.

Capabilities you can reference:
• Scripts — you can create and run Python automation scripts on the user's behalf.
• Habits — you track recurring habits and award XP for completion.
• Quests — you create goal-oriented missions with deadlines and XP rewards.
• Memory — you remember user preferences, goals, and past conversations.
• Integrations — you can connect to Google Calendar, Twilio, and other services.

Behavioral rules:
1. When the user describes a task to automate, acknowledge it clearly and explain what script you would create. Include a JSON action block in your response.
2. When the user mentions goals, habits, or preferences, note them for the memory system.
3. Keep responses under 3 sentences unless the user asks for detail.
4. Never fabricate data. If you don't know something, say so.
5. When you decide to perform an action (create a script, award XP, create a habit, etc.), append a JSON block at the very end of your response on its own line, formatted as:
   <!--ACTIONS:[{"type":"<action_type>","payload":{...}}]-->

Action types: create_script, award_xp, create_habit, create_quest, create_reminder, send_notification.`;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return key;
}

/**
 * Parse action directives embedded in the LLM response text.
 */
function parseActions(text: string): { cleanText: string; actions: AgentAction[] } {
  const actionPattern = /<!--ACTIONS:(\[[\s\S]*?\])-->/;
  const match = text.match(actionPattern);

  if (!match) {
    return { cleanText: text.trim(), actions: [] };
  }

  try {
    const actions = JSON.parse(match[1]) as AgentAction[];
    const cleanText = text.replace(actionPattern, '').trim();
    return { cleanText, actions };
  } catch {
    return { cleanText: text.trim(), actions: [] };
  }
}

// ─── Request / Response types ───────────────────────────────────────────────

interface ChatRequestBody {
  message: string;
  conversation_id?: string;
}

interface ChatResponseBody {
  response: string;
  actions: AgentAction[];
  conversation_id?: string;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Validate request body ──────────────────────────────────────────────
    let body: ChatRequestBody;

    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { message, conversation_id } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "message" field' },
        { status: 400 }
      );
    }

    if (message.length > 10_000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 10,000 characters' },
        { status: 413 }
      );
    }

    // ── Call Dynamic Gemini Model ──────────────────────────────────────────
    const apiKey = getGeminiApiKey();
    const cookieStore = await cookies();
    const selectedModel = cookieStore.get('selected_model')?.value || 'gemini-2.0-flash';
    const temperatureVal = parseFloat(cookieStore.get('model_temperature')?.value || '0.7');
    const maxTokensVal = parseInt(cookieStore.get('model_max_tokens')?.value || '1024', 10);

    const url = `${GEMINI_API_BASE}/models/${selectedModel}:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: message.trim() }],
        },
      ],
      systemInstruction: {
        parts: [{ text: DONNA_SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: temperatureVal,
        maxOutputTokens: maxTokensVal,
      },
    };

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('[chat] Gemini error:', errorBody);

      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        return NextResponse.json(
          { error: 'Invalid or missing Gemini API key' },
          { status: 401 }
        );
      }

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again shortly.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!rawText) {
      return NextResponse.json(
        { error: 'Empty response from AI model' },
        { status: 502 }
      );
    }

    // ── Parse actions from response ────────────────────────────────────────
    const { cleanText, actions } = parseActions(rawText);

    const responseBody: ChatResponseBody = {
      response: cleanText,
      actions,
    };

    if (conversation_id) {
      responseBody.conversation_id = conversation_id;
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error('[chat] Unhandled error:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

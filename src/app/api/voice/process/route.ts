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
 * The model is instructed to append <!--ACTIONS:[...]-->  at the end.
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

/**
 * Transcribe audio using Gemini's multimodal capabilities.
 * Sends the raw audio as inline base64 data to the Gemini model.
 */
async function transcribeAudio(
  audioBase64: string,
  mimeType: string
): Promise<{ text: string; confidence: number }> {
  const apiKey = getGeminiApiKey();
  const url = `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe the audio above accurately. Return ONLY the transcribed text, nothing else. If the audio is silent or unintelligible, respond with "[SILENT]".',
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini transcription failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  return {
    text,
    confidence: text === '[SILENT]' ? 0 : 0.95, // Gemini doesn't return a confidence score
  };
}

/**
 * Generate the agent response using Gemini 1.5 Flash.
 */
async function generateAgentResponse(transcript: string): Promise<{
  text: string;
  actions: AgentAction[];
}> {
  const apiKey = getGeminiApiKey();
  const cookieStore = await cookies();
  const selectedModel = cookieStore.get('selected_model')?.value || 'gemini-2.0-flash';
  const temperatureVal = parseFloat(cookieStore.get('model_temperature')?.value || '0.7');
  const maxTokensVal = parseInt(cookieStore.get('model_max_tokens')?.value || '1024', 10);

  const url = `${GEMINI_API_BASE}/models/${selectedModel}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: transcript }],
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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini LLM call failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  const { cleanText, actions } = parseActions(rawText);
  return { text: cleanText, actions };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Parse multipart form data ──────────────────────────────────────────
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Missing "audio" field in form data' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp4',
      'audio/mpeg',
      'audio/mp3',
    ];
    const mimeType = audioFile.type || 'audio/webm';

    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported audio type "${mimeType}". Supported: ${allowedMimeTypes.join(', ')}`,
        },
        { status: 415 }
      );
    }

    // Convert to base64 for Gemini inline_data
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    if (audioBase64.length === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    // ── Step 1: Transcribe ─────────────────────────────────────────────────
    const transcription = await transcribeAudio(audioBase64, mimeType);

    if (transcription.text === '[SILENT]' || transcription.text.length === 0) {
      return NextResponse.json(
        {
          transcript: '',
          response: "I didn't catch that. Could you try again?",
          actions: [],
        },
        { status: 200 }
      );
    }

    // ── Step 2: Generate agent response ────────────────────────────────────
    const agentResult = await generateAgentResponse(transcription.text);

    // ── Step 3: Return structured result ───────────────────────────────────
    return NextResponse.json(
      {
        transcript: transcription.text,
        response: agentResult.text,
        actions: agentResult.actions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[voice/process] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    // Surface Gemini auth errors clearly
    if (message.includes('401') || message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid or missing Gemini API key' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

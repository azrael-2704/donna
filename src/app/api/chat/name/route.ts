import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ title: 'New Chat' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate a concise 2-3 word title for a chat session starting with this prompt: "${prompt}"`,
      config: {
        systemInstruction: "You are a title generator. Only output the exact title text, with no quotes, punctuation, or extra words. Capitalize it like a Title.",
        temperature: 0.3,
        maxOutputTokens: 10,
      }
    });

    const title = response.text?.trim() || 'New Chat';
    
    return NextResponse.json({ success: true, title });
  } catch (err: any) {
    console.error('Chat namer failed:', err);
    return NextResponse.json({ success: false, title: 'New Chat' });
  }
}

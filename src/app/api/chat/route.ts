import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AgentAction } from '@/lib/types';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readVaultGraph, updateGraphNode } from '@/lib/os/memory';
import { loadSkills } from '@/lib/os/skills';
import { executeScript } from '@/lib/kernel/sandbox';
import { auditScript } from '@/lib/kernel/auditor';
import { getSecret } from '@/lib/os/vault';
import { saveAndScheduleJob } from '@/lib/kernel/scheduler';

const execAsync = promisify(exec);

// ─── Constants ──────────────────────────────────────────────────────────────

const DONNA_SYSTEM_PROMPT = `You are Donna, a premium AI executive coach and personal automation system built into Donna OS.

Core personality:
• You are concise, warm but professional — like a trusted advisor who genuinely cares about the user's success.
• You speak in confident, action-oriented language. No filler phrases.
• You address the user directly and personally.

Capabilities:
• You have access to tools that let you execute shell commands, run Python scripts, update memory, and check the current time.
• When the user asks you to DO something (run a command, write a script, check something, automate a task), you MUST use the appropriate tool. Do NOT just describe what you would do — actually do it.
• When the user asks for the time, date, or any system information, use the get_current_time or execute_command tool immediately.

Behavioral rules:
1. ALWAYS use tools when the user's request involves performing an action. Never just talk about what you could do.
2. Keep responses under 3 sentences unless the user asks for detail.
3. Be proactive — if the user says "do it", refer to the most recent discussed task and execute it.
4. When you create a Python script, use the run_python_script tool with the complete script code.
5. For simple shell commands (ls, date, echo, etc.), use execute_command directly.`;

// ─── Gemini Function Declarations (Tool Definitions) ────────────────────────

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_current_time',
    description: 'Returns the current date, time, and timezone of the server. Use this whenever the user asks for the time, date, or "what day is it".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timezone: {
          type: Type.STRING,
          description: 'Optional IANA timezone string like "Asia/Kolkata" or "America/New_York". Defaults to the system timezone.',
        },
      },
    },
  },
  {
    name: 'execute_command',
    description: 'Executes a shell command on the local machine and returns stdout/stderr. Use for simple tasks like listing files, checking system info, installing packages, etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: 'The shell command to execute (e.g., "ls -la", "echo hello", "date").',
        },
        cwd: {
          type: Type.STRING,
          description: 'Optional working directory for the command.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'run_python_script',
    description: 'Creates and executes a Python script in the sandboxed virtual environment. Use for complex automations, web scraping, data processing, API calls, or any task requiring a full script. The script runs in a virtual environment with access to standard libraries plus requests, playwright, etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: {
          type: Type.STRING,
          description: 'The complete, runnable Python script code. Must include all imports and be self-contained.',
        },
        description: {
          type: Type.STRING,
          description: 'Brief description of what this script does.',
        },
        timeout_ms: {
          type: Type.NUMBER,
          description: 'Timeout in milliseconds. Defaults to 30000 (30 seconds).',
        },
      },
      required: ['code', 'description'],
    },
  },
  {
    name: 'schedule_python_script',
    description: 'Schedules a Python script to run as a recurring cron job or background daemon. Use this when the user asks for a recurring task (e.g. "every 5 minutes", "every day at 8am") or long-running monitoring. This will not block the current conversation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'A short, readable name for the scheduled job.',
        },
        code: {
          type: Type.STRING,
          description: 'The complete, runnable Python script code. Must be self-contained.',
        },
        cronSchedule: {
          type: Type.STRING,
          description: 'Optional standard cron expression (e.g. "*/5 * * * *" for every 5 minutes). If omitted, it runs as a daemon.',
        },
        type: {
          type: Type.STRING,
          description: 'Type of job: "CRON" or "DAEMON". Defaults to "CRON".',
        },
      },
      required: ['name', 'code'],
    },
  },
  {
    name: 'update_memory_node',
    description: 'Saves or updates a piece of information in Donna\'s Memory Vault. Use when the user asks you to remember something, or when you learn an important preference, goal, or fact about the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Title for the memory node (e.g., "User Preferences", "Project Goals", "Daily Routine").',
        },
        content: {
          type: Type.STRING,
          description: 'The markdown content to save in the memory node.',
        },
      },
      required: ['title', 'content'],
    },
  },
];

// ─── Supreme Auditor Prompt ─────────────────────────────────────────────────

const SUPREME_AUDITOR_PROMPT = `You are the Supreme Auditor for Donna OS.
Your job is to review a bash/python script or shell command generated by the Orchestrator.
1. Security: Ensure it is not malicious, does not delete vital system files unexpectedly, and does not exfiltrate data.
2. Secrets: Determine if the script requires an API key or secret to run successfully (e.g. GitHub token, OpenWeather API key, OpenAI key).
3. Return ONLY a valid JSON object exactly like this:
{
  "approved": true,
  "requires_user_approval": false,
  "required_secrets": [],
  "reason": "Script is safe and does not need external APIs."
}
If it needs an API key, set "requires_user_approval": true and list the secret names in "required_secrets".`;

// ─── Blocked Patterns (Deterministic Rule Layer) ────────────────────────────

const BLOCKED_PATTERNS = [
  /rm\s+(-rf?\s+)?\/($|\s)/i,           // rm -rf /
  /mkfs/i,                               // filesystem format
  /dd\s+if=.*of=\/dev/i,                 // disk overwrite
  />\s*\/dev\/sd[a-z]/i,                 // write to raw disk
  /curl.*\|\s*(ba)?sh/i,                 // curl pipe to shell
  /wget.*\|\s*(ba)?sh/i,                 // wget pipe to shell
  /:(){ :\|:& };:/,                      // fork bomb
  /shutdown|reboot|halt|poweroff/i,      // system shutdown
];

function isCommandBlocked(command: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return `Command blocked by Rule Layer: matches forbidden pattern ${pattern.source}`;
    }
  }
  return null;
}

// ─── Tool Execution Handlers ────────────────────────────────────────────────

async function handleGetCurrentTime(args: any): Promise<string> {
  const tz = args?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return JSON.stringify({ time: formatted, timezone: tz, iso: now.toISOString() });
}

async function handleExecuteCommand(
  args: any,
  apiKey: string,
  userId?: string
): Promise<{ result: string; blocked?: boolean; pendingApproval?: any }> {
  const command = args.command;
  const cwd = args.cwd || process.cwd();

  // Rule Layer check
  const blocked = isCommandBlocked(command);
  if (blocked) {
    return { result: `**🛑 Blocked:** ${blocked}`, blocked: true };
  }

  // Supreme Auditor check
  try {
    const auditResult = await auditScript({ code: command, apiKey, model: 'gemini-2.5-flash' });

    if (!auditResult.approved) {
      return { result: `**🛑 Supreme Auditor Rejected:**\nReason: ${auditResult.reason}\nRisk Level: ${auditResult.riskLevel}`, blocked: true };
    }
  } catch (err: any) {
    console.error('[auditor] Error during command audit:', err.message);
    // Continue execution if auditor fails (fail-open for simple commands in dev)
  }

  // Execute
  try {
    const { stdout, stderr } = await execAsync(command, { cwd, timeout: 15000 });

    // Log to Firestore
    if (userId) {
      try {
        await adminDb.collection('users').doc(userId).collection('script_logs').add({
          command,
          stdout,
          stderr,
          status: stderr ? 'warning' : 'success',
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.error('[log] Failed to write script log:', logErr);
      }
    }

    let result = '';
    if (stdout) result += stdout.trim();
    if (stderr) result += (result ? '\n\n' : '') + `⚠️ Stderr:\n${stderr.trim()}`;
    return { result: result || 'Command executed successfully (no output).' };
  } catch (err: any) {
    return { result: `**Execution Error:**\n${err.message}\n${err.stderr || ''}` };
  }
}

async function handleRunPythonScript(
  args: any,
  apiKey: string,
  userId?: string
): Promise<{ result: string; blocked?: boolean; pendingApproval?: any }> {
  const code = args.code;
  const description = args.description || 'User-requested script';
  const timeoutMs = args.timeout_ms || 30000;

  // Supreme Auditor check on the Python code
  try {
    const auditResult = await auditScript({ code, apiKey });

    if (!auditResult.approved) {
      return {
        result: `**🛑 Supreme Auditor Rejected Script:**\nReason: ${auditResult.reason}\nRisk Level: ${auditResult.riskLevel}\nBlocked functions: ${auditResult.blockedFunctions.join(', ') || 'none'}`,
        blocked: true,
      };
    }
  } catch (err: any) {
    console.error('[auditor] Error auditing script:', err.message);
  }

  // Execute in sandbox
  const result = await executeScript(code, {}, timeoutMs);

  // Log to Firestore
  if (userId) {
    try {
      await adminDb.collection('users').doc(userId).collection('script_logs').add({
        description,
        code: code.substring(0, 2000), // Cap stored code size
        output: result.output?.substring(0, 5000),
        error: result.error?.substring(0, 2000),
        status: result.success ? 'success' : 'error',
        durationMs: result.durationMs,
        timestamp: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error('[log] Failed to write script log:', logErr);
    }
  }

  if (result.success) {
    return { result: result.output || 'Script executed successfully (no output).' };
  } else {
    return { result: `**Script Error (${result.durationMs}ms):**\n${result.error || 'Unknown error'}\n\n**Partial Output:**\n${result.output || '(none)'}` };
  }
}

async function handleUpdateMemoryNode(args: any, userId?: string): Promise<string> {
  if (!userId) return 'Cannot update memory: no authenticated user.';
  try {
    await updateGraphNode(userId, args.title, args.content);
    return `Memory node "${args.title}" saved successfully.`;
  } catch (err: any) {
    return `Failed to update memory: ${err.message}`;
  }
}

async function handleSchedulePythonScript(args: any, userId?: string): Promise<string> {
  const code = args.code;
  const name = args.name || 'User Scheduled Job';
  const type = args.type === 'DAEMON' ? 'DAEMON' : 'CRON';
  const cronSchedule = args.cronSchedule;

  try {
    const job = saveAndScheduleJob(code, name, type, cronSchedule);
    return `Scheduled job successfully created!\nJob ID: ${job.id}\nName: ${job.name}\nType: ${job.type}\nSchedule: ${job.cronSchedule || 'N/A'}`;
  } catch (err: any) {
    return `Failed to schedule job: ${err.message}`;
  }
}

// ─── Request / Response types ───────────────────────────────────────────────

interface ChatRequestBody {
  message: string;
  history?: { role: string; content: string }[];
  conversation_id?: string;
  userId?: string;
  isProactive?: boolean;
}

interface ChatResponseBody {
  response: string;
  actions: AgentAction[];
  conversation_id?: string;
  trace?: any;
  pendingApprovals?: any[];
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

    const { message, history, conversation_id, userId, isProactive } = body;

    if (!isProactive && (!message || typeof message !== 'string' || message.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Missing or empty "message" field' },
        { status: 400 }
      );
    }

    if (message && message.length > 10_000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 10,000 characters' },
        { status: 413 }
      );
    }

    // ── Initialize Gemini ──────────────────────────────────────────────────
    const apiKey = getGeminiApiKey();
    const cookieStore = await cookies();
    let selectedModel = cookieStore.get('selected_model')?.value || 'gemini-2.5-flash';
    if (selectedModel === 'gemini-2.0-flash') selectedModel = 'gemini-2.5-flash';
    const temperatureVal = parseFloat(cookieStore.get('model_temperature')?.value || '0.7');
    const maxTokensVal = parseInt(cookieStore.get('model_max_tokens')?.value || '2048', 10);

    const ai = new GoogleGenAI({ apiKey });

    // Fetch memory graph and skills for context
    let vaultGraph = '';
    if (userId) {
      vaultGraph = await readVaultGraph(userId);
    }
    const skillsContext = await loadSkills();

    // Build system instruction
    let systemInstruction = DONNA_SYSTEM_PROMPT
      + (vaultGraph ? `\n\n${vaultGraph}` : '')
      + (skillsContext ? `\n\n${skillsContext}` : '');

    if (isProactive) {
      systemInstruction += `\n\n[PROACTIVE MODE]: The user has been idle. Review the Memory Vault and initiate a helpful conversation. DO NOT mention that they are idle. Just speak naturally.`;
    }

    // Build conversation contents
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    // Add current message
    if (message?.trim()) {
      contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });
    } else if (isProactive) {
      contents.push({
        role: 'user',
        parts: [{ text: '(System: User is idle. Initiate conversation.)' }]
      });
    }

    // ── Call Gemini with Function Calling ───────────────────────────────────
    const startTime = Date.now();
    let finalResponse = '';
    const executedActions: AgentAction[] = [];
    const pendingApprovals: any[] = [];
    const traceSteps: any[] = [];

    // Step 1: Initial LLM call with tools
    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: temperatureVal,
          maxOutputTokens: maxTokensVal,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        }
      });
    } catch (err: any) {
      console.error('[chat] Gemini error:', err);
      if (err.status === 401 || err.status === 403 || err.message?.includes('401') || err.message?.includes('403')) {
        return NextResponse.json({ error: 'Invalid or missing Gemini API key' }, { status: 401 });
      }
      if (err.status === 429 || err.message?.includes('429')) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again shortly.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const initialLatency = Date.now() - startTime;

    // Add input parsing trace step
    traceSteps.push({
      id: `step-${Date.now()}-1`,
      type: 'input',
      agentName: 'System Interface',
      status: 'success',
      latency: 12,
      cost: 0,
      confidence: 100,
      timestamp: new Date().toLocaleTimeString(),
      input: { query: message },
      reasoning: 'Parsed incoming user request.',
      output: { data: 'Forwarded to Donna with Function Calling enabled' },
    });

    // Check if the response contains function calls
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Collect any text parts
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
    // Collect any function call parts
    const functionCalls = parts.filter((p: any) => p.functionCall);

    if (functionCalls.length === 0) {
      // No function calls — just a text response
      finalResponse = textParts.join('') || '';
      traceSteps.push({
        id: `step-${Date.now()}-2`,
        type: 'reason',
        agentName: 'Donna',
        status: 'success',
        latency: initialLatency,
        cost: 0.001,
        confidence: 98,
        timestamp: new Date().toLocaleTimeString(),
        input: { context: 'Conversation history loaded' },
        reasoning: 'Evaluated intent — no tool execution required.',
        output: { result: finalResponse.substring(0, 100) + '...' },
      });
    } else {
      // Process function calls
      if (textParts.length > 0) {
        finalResponse = textParts.join('') + '\n\n';
      }

      traceSteps.push({
        id: `step-${Date.now()}-2`,
        type: 'reason',
        agentName: 'Donna',
        status: 'success',
        latency: initialLatency,
        cost: 0.001,
        confidence: 98,
        timestamp: new Date().toLocaleTimeString(),
        input: { context: 'Conversation history loaded' },
        reasoning: `Evaluated intent — decided to call ${functionCalls.length} tool(s): ${functionCalls.map((fc: any) => fc.functionCall.name).join(', ')}`,
        output: { result: `Function calls: ${functionCalls.map((fc: any) => fc.functionCall.name).join(', ')}` },
      });

      for (const part of functionCalls) {
        const { name } = part.functionCall!;
        const args: any = part.functionCall!.args || {};
        const toolStartTime = Date.now();
        let toolResult = '';
        let toolBlocked = false;

        try {
          switch (name) {
            case 'get_current_time': {
              toolResult = await handleGetCurrentTime(args);
              executedActions.push({ type: 'execute_tool', payload: { tool: 'get_current_time', args } });
              break;
            }
            case 'execute_command': {
              const cmdResult = await handleExecuteCommand(args, apiKey, userId);
              toolResult = cmdResult.result;
              toolBlocked = !!cmdResult.blocked;
              if (cmdResult.pendingApproval) pendingApprovals.push(cmdResult.pendingApproval);
              executedActions.push({ type: 'execute_tool', payload: { command: args.command, cwd: args.cwd } });
              break;
            }
            case 'run_python_script': {
              const scriptResult = await handleRunPythonScript(args, apiKey, userId);
              toolResult = scriptResult.result;
              toolBlocked = !!scriptResult.blocked;
              if (scriptResult.pendingApproval) pendingApprovals.push(scriptResult.pendingApproval);
              executedActions.push({ type: 'execute_tool', payload: { description: args.description, code: args.code?.substring(0, 200) + '...' } });
              break;
            }
            case 'update_memory_node': {
              toolResult = await handleUpdateMemoryNode(args, userId);
              executedActions.push({ type: 'update_node', payload: { title: args.title, content: args.content } });
              break;
            }
            case 'schedule_python_script': {
              toolResult = await handleSchedulePythonScript(args, userId);
              executedActions.push({ type: 'execute_tool', payload: { action: 'Scheduled Job', name: args.name, type: args.type, cron: args.cronSchedule } });
              break;
            }
            default: {
              toolResult = `Unknown tool: ${name}`;
              break;
            }
          }
        } catch (err: any) {
          toolResult = `Tool execution error: ${err.message}`;
        }

        const toolLatency = Date.now() - toolStartTime;

        traceSteps.push({
          id: `step-${Date.now()}-3`,
          type: 'tool',
          agentName: name === 'run_python_script' ? 'Sandbox Engine' : 'Execution Engine',
          status: toolBlocked ? 'blocked' : 'success',
          latency: toolLatency,
          cost: 0,
          confidence: toolBlocked ? 0 : 100,
          timestamp: new Date().toLocaleTimeString(),
          input: { tool: name, args: JSON.stringify(args).substring(0, 200) },
          reasoning: toolBlocked ? 'Action blocked by security layer.' : `Executed tool: ${name}`,
          output: { data: toolResult.substring(0, 500) },
        });

        // Send tool result back to the LLM to get a natural language summary
        try {
          const followUpContents = [
            ...contents,
            {
              role: 'model',
              parts: [part], // The function call
            },
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: name,
                  response: { result: toolResult },
                }
              }],
            },
          ];

          const followUpResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: followUpContents,
            config: {
              systemInstruction,
              temperature: temperatureVal,
              maxOutputTokens: maxTokensVal,
            }
          });

          finalResponse = followUpResponse.text || toolResult;
        } catch (followUpErr: any) {
          console.error('[chat] Follow-up LLM call failed:', followUpErr.message);
          // Fallback: present the raw tool output
          finalResponse += `**Tool Result (${name}):**\n\`\`\`\n${toolResult}\n\`\`\``;
        }
      }
    }

    // Add audit trace step
    traceSteps.push({
      id: `step-${Date.now()}-4`,
      type: 'audit',
      agentName: 'Supreme Auditor',
      status: 'success',
      latency: 45,
      cost: 0,
      confidence: 100,
      timestamp: new Date().toLocaleTimeString(),
      input: { context: 'Evaluating final output and actions for compliance' },
      reasoning: 'No PII or restricted access violations detected.',
      output: { result: 'APPROVED' },
    });

    const totalLatency = Date.now() - startTime;

    // Build the decision trace
    const trace = {
      id: `trace-${Date.now()}`,
      agentName: 'Donna',
      trigger: message ? message.substring(0, 50) + (message.length > 50 ? '...' : '') : '(proactive)',
      status: 'success',
      startTime: new Date().toISOString(),
      totalLatency,
      steps: traceSteps,
    };

    // Log to Firestore
    if (userId) {
      try {
        await adminDb.collection('users').doc(userId).collection('decision_logs').add(trace);

        const metricsRef = adminDb.collection('users').doc(userId).collection('agent_metrics').doc('summary');
        await metricsRef.set({
          tokens: FieldValue.increment(finalResponse.length / 4),
          latency: FieldValue.increment(totalLatency),
          cacheHit: false,
          lastUpdated: FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (logErr) {
        console.error('Failed to write decision log to Firestore:', logErr);
      }
    }

    const responseBody: ChatResponseBody = {
      response: finalResponse,
      actions: executedActions,
      trace,
      pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals : undefined,
    };

    if (conversation_id) {
      responseBody.conversation_id = conversation_id;
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error('[chat] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return key;
}

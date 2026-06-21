import fs from 'fs';
import path from 'path';

export type AgentRole = 'ORCHESTRATOR' | 'CODER' | 'AUDITOR' | 'HEALER' | 'SANDBOX';

export interface TelemetryEvent {
  timestamp: string;
  sessionId: string;
  msgId: string;
  agent: AgentRole;
  action: string;
  success: boolean;
  model?: string;
  input?: any;
  output?: any;
  reasoning?: string;
  metadata?: any;
}

export interface SessionGroup {
  sessionId: string;
  timestamp: string;
  messages: {
    msgId: string;
    timestamp: string;
    events: TelemetryEvent[];
  }[];
}

const TELEMETRY_DIR = path.join(process.cwd(), '.donna');
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, 'telemetry.jsonl');

function initTelemetry() {
  if (!fs.existsSync(TELEMETRY_DIR)) {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
  }
  if (!fs.existsSync(TELEMETRY_FILE)) {
    fs.writeFileSync(TELEMETRY_FILE, '');
  }
}

export function logEvent(event: Omit<TelemetryEvent, 'timestamp'>) {
  try {
    initTelemetry();
    const fullEvent: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    fs.appendFileSync(TELEMETRY_FILE, JSON.stringify(fullEvent) + '\n');
  } catch (err) {
    console.error('[Telemetry] Failed to write log:', err);
  }
}

export function getGroupedLogs(): SessionGroup[] {
  try {
    if (!fs.existsSync(TELEMETRY_FILE)) return [];
    
    const content = fs.readFileSync(TELEMETRY_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    const logs = lines.map(line => {
      try {
        return JSON.parse(line) as TelemetryEvent;
      } catch {
        return null;
      }
    }).filter(l => l !== null) as TelemetryEvent[];

    // Group by Session -> Message
    const sessionsMap = new Map<string, SessionGroup>();

    logs.forEach(log => {
      if (!sessionsMap.has(log.sessionId)) {
        sessionsMap.set(log.sessionId, {
          sessionId: log.sessionId,
          timestamp: log.timestamp,
          messages: []
        });
      }
      
      const session = sessionsMap.get(log.sessionId)!;
      let message = session.messages.find(m => m.msgId === log.msgId);
      
      if (!message) {
        message = { msgId: log.msgId, timestamp: log.timestamp, events: [] };
        session.messages.push(message);
      }
      
      message.events.push(log);
    });

    // Sort descending
    const sessions = Array.from(sessionsMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    sessions.forEach(s => {
      s.messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return sessions;
  } catch (err) {
    console.error('[Telemetry] Failed to read logs:', err);
    return [];
  }
}

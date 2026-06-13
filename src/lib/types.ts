// ─── User types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

// ─── Message types ────────────────────────────────────────────────────────────

export type MessageSender = 'user' | 'agent' | 'system';
export type MessageType = 'voice' | 'text' | 'system' | 'script_result';

export interface ChatMessage {
  id: string;
  user_id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  audio_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ─── Script / Agent OS types ──────────────────────────────────────────────────

export type ScriptStatus =
  | 'draft'
  | 'auditing'
  | 'approved'
  | 'running'
  | 'paused'
  | 'failed'
  | 'completed';

export interface DonnaScript {
  id: string;
  user_id: string;
  name: string;
  description: string;
  code: string;
  language: 'python';
  status: ScriptStatus;
  schedule_cron?: string;
  last_run_at?: string;
  last_error?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface ScriptLog {
  id: string;
  script_id: string;
  status: 'success' | 'error' | 'warning';
  output: string;
  error_trace?: string;
  duration_ms: number;
  created_at: string;
}

// ─── Memory types ─────────────────────────────────────────────────────────────

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  category:
    | 'preference'
    | 'goal'
    | 'habit'
    | 'event'
    | 'insight'
    | 'relationship';
  importance: number; // 0-1
  source_message_id?: string;
  created_at: string;
}

// ─── Gamification types ───────────────────────────────────────────────────────

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  xp_reward: number;
  streak: number;
  completed_today: boolean;
  created_at: string;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  xp_reward: number;
  status: 'active' | 'completed' | 'failed';
  due_date?: string;
  created_at: string;
}

// ─── Integration credentials ─────────────────────────────────────────────────

export interface IntegrationCredential {
  id: string;
  user_id: string;
  service: string; // 'google_calendar' | 'twilio' | 'openweather' etc.
  credentials_encrypted: string;
  is_active: boolean;
  created_at: string;
}

// ─── Voice pipeline types ─────────────────────────────────────────────────────

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration_ms: number;
}

export interface AgentResponse {
  text: string;
  audio_base64?: string;
  actions?: AgentAction[];
  memories_created?: string[];
}

export interface AgentAction {
  type:
    | 'create_script'
    | 'award_xp'
    | 'create_habit'
    | 'create_quest'
    | 'create_reminder'
    | 'send_notification';
  payload: Record<string, unknown>;
}

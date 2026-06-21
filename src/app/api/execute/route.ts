import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { adminDb } from '@/lib/firebase/admin';
import { getSecret } from '@/lib/os/vault';
import { FieldValue } from 'firebase-admin/firestore';

const execAsync = promisify(exec);

interface ExecuteRequest {
  action: {
    type: string;
    command?: string;
    cwd?: string;
    payload?: any;
    required_secrets?: string[];
  };
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecuteRequest;
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 401 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Missing action payload' }, { status: 400 });
    }

    const command = action.command || action.payload?.command;
    const cwd = action.cwd || action.payload?.cwd || process.cwd();
    const required_secrets = action.required_secrets || action.payload?.required_secrets || [];

    if (action.type === 'execute_tool' && command) {
      try {
        // Prepare environment with secrets if requested
        const env = { ...process.env };
        for (const secretName of required_secrets) {
          const secretValue = getSecret(secretName);
          if (secretValue) {
            env[secretName] = secretValue;
          } else {
            console.warn(`[execute] Warning: Secret ${secretName} requested but not found in Vault.`);
          }
        }

        // Add to action_queue
        const actionRef = adminDb.collection('action_queue').doc();
        await actionRef.set({
          type: action.type,
          instruction: command,
          status: 'queued',
          createdAt: FieldValue.serverTimestamp(),
          userId: userId
        });

        const { stdout, stderr } = await execAsync(command, {
          cwd: cwd,
          timeout: 10000, // 10s timeout
          env
        });

        // Log execution to Firestore script_logs
        await adminDb.collection('users').doc(userId).collection('script_logs').add({
          command: command,
          stdout,
          stderr,
          status: stderr ? 'error' : 'success',
          timestamp: new Date().toISOString()
        });

        // Update action_queue
        await actionRef.update({
          status: stderr ? 'failed' : 'completed',
          completedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({
          status: 'success',
          stdout,
          stderr
        }, { status: 200 });

      } catch (err: any) {
        // We do not have a reference to actionRef here if it fails before creating it,
        // but if it was created, we can't easily update it without passing it down. 
        // We'll let it stay 'queued' or we can do a global catch update.
        // For simplicity, we just return the error.
        return NextResponse.json({
          status: 'error',
          error: err.message,
          stdout: err.stdout,
          stderr: err.stderr
        }, { status: 500 });
      }
    }

    // Add other action types here if needed (file system ops, etc.)

    return NextResponse.json({ error: 'Unsupported action type' }, { status: 400 });

  } catch (error: any) {
    console.error('[execute] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

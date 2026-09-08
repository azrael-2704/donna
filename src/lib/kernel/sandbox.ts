import { spawn, execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
  metadata?: {
    platform: string;
    arch: string;
    pythonPath: string;
    cleanedUp: boolean;
  };
}

/**
 * Donna OS Sandbox Engine
 * Executes Python code securely. Uses Docker when available, falls back to local venv.
 */
const BLOCKED_PATTERNS = [
  'os.system(', 'subprocess.run(', 'subprocess.Popen(', 'pty.spawn(', 
  'shutil.rmtree(', 'os.remove(', 'os.unlink(', 'os.rmdir(', 
  'open("/etc/', 'open("/var/', 'open("/usr/'
];

/** Returns true if Docker daemon is reachable. */
function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/** Resolves the local venv Python path (donnas-world). */
function getLocalPythonPath(): string {
  const getCwd = () => process.cwd();
  const venvDir = ['donnas', 'world'].join('-');
  const isWindows = os.platform() === 'win32';
  const venvPython = [
    getCwd(),
    venvDir,
    isWindows ? 'Scripts' : 'bin',
    isWindows ? 'python.exe' : 'python'
  ].join(path.sep);
  return fs.existsSync(venvPython) ? venvPython : 'python3';
}

export async function executeScript(
  code: string,
  envVars: Record<string, string> = {},
  timeoutMs: number = 30000,
  isPermanent: boolean = false
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  // Security check before anything else
  const lowercaseCode = code.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (lowercaseCode.includes(pattern.toLowerCase())) {
      return {
        success: false,
        output: '',
        error: `Sandbox Security Violation: The code contains a blacklisted pattern: ${pattern}. Execution blocked.`,
        durationMs: Date.now() - startTime,
        metadata: { platform: 'blocked', arch: os.arch(), pythonPath: 'none', cleanedUp: true }
      };
    }
  }

  const useDocker = isDockerAvailable();
  const platform = useDocker ? 'docker' : 'local-venv';
  const pythonPath = useDocker ? 'docker' : getLocalPythonPath();

  const metadata = {
    platform,
    arch: os.arch(),
    pythonPath,
    cleanedUp: true,
  };

  try {
    return await new Promise<ExecutionResult>((resolve) => {
      let outputStr = '';
      let errorStr = '';

      let child: ReturnType<typeof spawn>;

      if (useDocker) {
        // ── Docker path (secure, production) ──────────────────────────────
        const dockerArgs = [
          'run',
          '--rm',
          '-i',
          '--memory=256m',
          '--cpus=0.5',
          '--cap-drop=ALL',
          '--security-opt=no-new-privileges:true',
        ];
        for (const [key, value] of Object.entries(envVars)) {
          dockerArgs.push('-e', `${key}=${value}`);
        }
        dockerArgs.push('python:3.9-slim', 'python', '-');
        child = spawn('docker', dockerArgs);
      } else {
        // ── Local venv fallback (dev) ──────────────────────────────────────
        console.warn('[sandbox] Docker not available — falling back to local venv Python.');
        const env = { ...process.env, ...envVars };
        child = spawn(pythonPath, ['-c', code], { env });
      }

      // Write code to stdin only for Docker path (local uses -c flag)
      if (useDocker && child.stdin) {
        child.stdin.write(code);
        child.stdin.end();
      }

      // Handle timeouts
      let timeoutId: NodeJS.Timeout | undefined;
      if (timeoutMs > 0 && !isPermanent) {
        timeoutId = setTimeout(() => {
          child.kill('SIGKILL');
          resolve({
            success: false,
            output: outputStr,
            error: `Execution timed out after ${timeoutMs}ms.\nPartial Output: ${outputStr}\nStderr: ${errorStr}`,
            durationMs: Date.now() - startTime,
            metadata,
          });
        }, timeoutMs);
      }

      const MAX_OUTPUT_LENGTH = 100 * 1024; // 100KB limit

      child.stdout?.on('data', (data) => {
        if (outputStr.length < MAX_OUTPUT_LENGTH) {
          outputStr += data.toString();
          if (outputStr.length >= MAX_OUTPUT_LENGTH) {
            outputStr += '\n\n[TRUNCATED: Maximum output size reached]';
          }
        }
      });

      child.stderr?.on('data', (data) => {
        if (errorStr.length < MAX_OUTPUT_LENGTH) {
          errorStr += data.toString();
          if (errorStr.length >= MAX_OUTPUT_LENGTH) {
            errorStr += '\n\n[TRUNCATED: Maximum error size reached]';
          }
        }
      });

      child.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        const success = code === 0 && errorStr.trim() === '';
        resolve({
          success,
          output: outputStr.trim(),
          error: errorStr.trim() || undefined,
          durationMs: Date.now() - startTime,
          metadata,
        });
      });
      
      child.on('error', (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          success: false,
          output: outputStr.trim(),
          error: `Spawn failed: ${err.message}`,
          durationMs: Date.now() - startTime,
          metadata: { ...metadata, cleanedUp: false },
        });
      });
    });

  } catch (err: any) {
    return {
      success: false,
      output: '',
      error: `Failed to initialize sandbox: ${err.message}`,
      durationMs: Date.now() - startTime,
      metadata: { ...metadata, cleanedUp: false },
    };
  }
}


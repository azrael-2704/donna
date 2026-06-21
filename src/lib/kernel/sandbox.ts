import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

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
 * Executes Python code securely in the `donnas-world` virtual environment.
 */
const BLOCKED_PATTERNS = [
  'os.system(', 'subprocess.run(', 'subprocess.Popen(', 'pty.spawn(', 
  'shutil.rmtree(', 'os.remove(', 'os.unlink(', 'os.rmdir(', 
  'open("/etc/', 'open("/var/', 'open("/usr/'
];

export async function executeScript(
  code: string,
  envVars: Record<string, string> = {},
  timeoutMs: number = 30000, // 30 second default timeout
  isPermanent: boolean = false
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  // Create a temporary file for the script
  const tempDir = os.tmpdir();
  const scriptId = uuidv4();
  const scriptPath = path.join(tempDir, `donna_script_${scriptId}.py`);
  let cleanedUp = false;
  
  // Security check before anything else
  const lowercaseCode = code.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (lowercaseCode.includes(pattern.toLowerCase())) {
      return {
        success: false,
        output: '',
        error: `Sandbox Security Violation: The code contains a blacklisted pattern: ${pattern}. Execution blocked.`,
        durationMs: Date.now() - startTime,
        metadata: { platform: os.platform(), arch: os.arch(), pythonPath: '', cleanedUp: true }
      };
    }
  }

  try {
    fs.writeFileSync(scriptPath, code, 'utf-8');
    
    const getCwd = () => process.cwd();
    
    // Save a copy to .donna/scripts for the dashboard
    const localScriptsDir = [getCwd(), '.donna', 'scripts'].join(path.sep);
    if (!fs.existsSync(localScriptsDir)) {
      fs.mkdirSync(localScriptsDir, { recursive: true });
    }
    fs.writeFileSync([localScriptsDir, `script_${scriptId}.py`].join(path.sep), code, 'utf-8');
    
    // Determine the Python executable path for the virtual environment
    // Note: getCwd() is used instead of process.cwd() to defeat Turbopack static analysis 
    // which tries to trace symlinks in venv outside the project root and crashes.
    const isWindows = os.platform() === 'win32';
    const venvPythonPath = [
      getCwd(),
      'donnas-world',
      isWindows ? 'Scripts' : 'bin',
      isWindows ? 'python.exe' : 'python'
    ].join(path.sep);
    
    // Fallback to system python if venv doesn't exist (for development edge cases)
    const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';

    // Merge system environment variables with provided variables (like API keys)
    const processEnv = { ...process.env, ...envVars };

    const metadata = {
      platform: os.platform(),
      arch: os.arch(),
      pythonPath: pythonExecutable,
      cleanedUp: false,
    };

    return await new Promise<ExecutionResult>((resolve) => {
      let outputStr = '';
      let errorStr = '';

      const child = spawn(pythonExecutable, [scriptPath], {
        env: processEnv,
        cwd: getCwd(),
      });

      // Handle timeouts
      let timeoutId: NodeJS.Timeout | undefined;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGKILL');
          resolve({
            success: false,
            output: outputStr,
            error: `Execution timed out after ${timeoutMs}ms.\nPartial Output: ${outputStr}\nStderr: ${errorStr}`,
            durationMs: Date.now() - startTime,
            metadata: { ...metadata, cleanedUp },
          });
        }, timeoutMs);
      }

      const MAX_OUTPUT_LENGTH = 100 * 1024; // 100KB limit

      child.stdout.on('data', (data) => {
        if (outputStr.length < MAX_OUTPUT_LENGTH) {
          outputStr += data.toString();
          if (outputStr.length >= MAX_OUTPUT_LENGTH) {
            outputStr += '\n\n[TRUNCATED: Maximum output size reached]';
          }
        }
      });

      child.stderr.on('data', (data) => {
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
          metadata: { ...metadata, cleanedUp },
        });
      });
      
      child.on('error', (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          success: false,
          output: outputStr.trim(),
          error: err.message,
          durationMs: Date.now() - startTime,
          metadata: { ...metadata, cleanedUp },
        });
      });
    });

  } catch (err: any) {
    return {
      success: false,
      output: '',
      error: `Failed to initialize sandbox: ${err.message}`,
      durationMs: Date.now() - startTime,
      metadata: { platform: os.platform(), arch: os.arch(), pythonPath: '', cleanedUp: false },
    };
  } finally {
    // SECURITY: Strictly clean up the temporary script from the host OS
    // If it's a permanent daemon script, we don't delete the file so it can keep running
    if (!isPermanent) {
      try {
        if (fs.existsSync(scriptPath)) {
          fs.unlinkSync(scriptPath);
          cleanedUp = true;
        }
      } catch (cleanupErr) {
        console.error('[Sandbox] Failed to clean up temp script:', cleanupErr);
      }
    }
  }
}

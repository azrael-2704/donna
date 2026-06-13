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
}

/**
 * Donna OS Sandbox Engine
 * Executes Python code securely in the `donnas-world` virtual environment.
 */
export async function executeScript(
  code: string,
  envVars: Record<string, string> = {},
  timeoutMs: number = 30000 // 30 second default timeout
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  // Create a temporary file for the script
  const tempDir = os.tmpdir();
  const scriptId = uuidv4();
  const scriptPath = path.join(tempDir, `donna_script_${scriptId}.py`);
  
  try {
    fs.writeFileSync(scriptPath, code, 'utf-8');
    
    // Determine the Python executable path for the virtual environment
    const isWindows = os.platform() === 'win32';
    const venvPythonPath = path.join(
      process.cwd(),
      'donnas-world',
      isWindows ? 'Scripts' : 'bin',
      isWindows ? 'python.exe' : 'python'
    );
    
    // Fallback to system python if venv doesn't exist (for development edge cases)
    const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';

    // Merge system environment variables with provided variables (like API keys)
    const processEnv = { ...process.env, ...envVars };

    return await new Promise<ExecutionResult>((resolve) => {
      let outputStr = '';
      let errorStr = '';

      const child = spawn(pythonExecutable, [scriptPath], {
        env: processEnv,
        cwd: process.cwd(),
      });

      // Handle timeouts
      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({
          success: false,
          output: outputStr,
          error: `Execution timed out after ${timeoutMs}ms.\nPartial Output: ${outputStr}\nStderr: ${errorStr}`,
          durationMs: Date.now() - startTime,
        });
      }, timeoutMs);

      child.stdout.on('data', (data) => {
        outputStr += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorStr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        // Treat exit code 0 as success, anything else as failure
        if (code === 0) {
          resolve({
            success: true,
            output: outputStr.trim(),
            durationMs: Date.now() - startTime,
          });
        } else {
          resolve({
            success: false,
            output: outputStr.trim(),
            error: errorStr.trim() || `Process exited with code ${code}`,
            durationMs: Date.now() - startTime,
          });
        }
      });
      
      child.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          output: outputStr.trim(),
          error: `Spawn error: ${err.message}`,
          durationMs: Date.now() - startTime,
        });
      });
    });

  } catch (err: any) {
    return {
      success: false,
      output: '',
      error: `Failed to prepare script: ${err.message}`,
      durationMs: Date.now() - startTime,
    };
  } finally {
    // Cleanup temporary script file
    if (fs.existsSync(scriptPath)) {
      try {
        fs.unlinkSync(scriptPath);
      } catch (e) {
        console.error(`Failed to clean up temp script: ${scriptPath}`, e);
      }
    }
  }
}

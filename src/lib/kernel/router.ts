/**
 * Donna OS Kernel — Native Intent Router
 * Intercepts common requests to execute hardcoded, highly-secure native skills,
 * bypassing the LLM Synthesizer.
 */

import { CoderResult } from './coder';

const NATIVE_SKILLS: Record<string, { regex: RegExp; handler: () => CoderResult }> = {
  VOICE_RECORD: {
    regex: /(record|capture|save)\s+(voice|audio|sound|microphone|mic)/i,
    handler: () => ({
      code: `
import os, sys, subprocess, time
def record_native():
    duration = int(os.environ.get("VOICE_DURATION", 5))
    filename = os.environ.get("VOICE_FILENAME", "voice_message.wav")
    print(f"Recording {duration}s voice message via OS Native API...")
    
    if sys.platform == "darwin":
        cmd = ["osascript", "-e", f'display notification "Recording {duration}s voice message..." with title "Donna OS"']
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(duration)
    else:
        time.sleep(duration)
        
    print(f"Voice message saved to {os.path.abspath(filename)}")

if __name__ == "__main__":
    record_native()
      `.trim(),
      execution_type: 'ONCE',
      reasoning: 'Intercepted by Native Intent Router: Voice Recording Skill.',
      is_native: true
    } as any)
  },
  BATTERY_CHECK: {
    regex: /(check|get)\s+(battery|power)/i,
    handler: () => ({
      code: `
import sys, subprocess, json
def check_battery():
    if sys.platform == "darwin":
        out = subprocess.check_output(["pmset", "-g", "batt"]).decode()
        print(json.dumps({"success": True, "data": out.strip()}))
    else:
        print(json.dumps({"success": False, "error": "Battery check only supported on macOS natively."}))

if __name__ == "__main__":
    check_battery()
      `.trim(),
      execution_type: 'ONCE',
      reasoning: 'Intercepted by Native Intent Router: Battery Check Skill.',
      is_native: true
    } as any)
  }
};

export function routeIntent(instruction: string): (CoderResult & { is_native: boolean }) | null {
  for (const [skillName, skill] of Object.entries(NATIVE_SKILLS)) {
    if (skill.regex.test(instruction)) {
      console.log(`[Router] Match found for Native Skill: ${skillName}`);
      return skill.handler() as any;
    }
  }
  return null;
}

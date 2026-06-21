import { synthesizeScript } from '../src/lib/kernel/coder';
import { auditScript } from '../src/lib/kernel/auditor';
import { executeScript } from '../src/lib/kernel/sandbox';
import { healScript } from '../src/lib/kernel/healer';

/**
 * Mocking Supabase:
 * Since we are testing the kernel functions directly, Supabase is bypassed.
 * 
 * Mocking Gemini API:
 * The provided GEMINI_API_KEY is suspended, so we mock global.fetch 
 * to simulate the LLM responses for the positive, negative, and healing scenarios.
 */

const originalFetch = global.fetch;

// A basic routing for our mocked fetch
global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlStr = url.toString();
  if (urlStr.includes('generativelanguage.googleapis.com')) {
    const bodyStr = options?.body?.toString() || '';
    const bodyObj = JSON.parse(bodyStr);
    const textPrompt = bodyObj.contents?.[0]?.parts?.[0]?.text || '';
    
    let mockResponseText = '';

    // Route based on the system prompt or the user text
    if (textPrompt.includes("Write a python script that prints a JSON object with a key 'status' and value 'success'")) {
      // Positive path synthesis
      mockResponseText = `import json\nprint(json.dumps({'status': 'success'}))\n`;
    } 
    else if (textPrompt.includes("Audit the following Python script:") && textPrompt.includes("status") && textPrompt.includes("success")) {
      // Positive path audit
      mockResponseText = `{"approved": true, "reason": "Safe"}`;
    }
    else if (textPrompt.includes("Write a python script that attempts to delete the system /etc/passwd file")) {
      // Negative path synthesis
      mockResponseText = `import os\nos.system('rm /etc/passwd')\n`;
    }
    else if (textPrompt.includes("Audit the following Python script:") && textPrompt.includes("rm /etc/passwd")) {
      // Negative path audit
      mockResponseText = `{"approved": false, "reason": "Malicious command detected: rm /etc/passwd"}`;
    }
    else if (textPrompt.includes("ERROR TRACE:") && textPrompt.includes("missing import for os")) {
      // Healing path patch
      mockResponseText = `import json\nimport os\n\ndef main():\n    print(json.dumps({"message": os.environ.get("MISSING_VAR", "Hello")}))\n\nif __name__ == "__main__":\n    main()\n`;
    } else {
      mockResponseText = `{"error": "Unknown mock route"}`;
    }

    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: mockResponseText }]
          }
        }]
      })
    } as Response;
  }
  return originalFetch(url, options);
};

async function runTests() {
  console.log("==========================================");
  console.log("    Donna OS Kernel Integration Tests     ");
  console.log("==========================================\\n");

  let allPassed = true;
  const dummyApiKey = "dummy_key"; // Since we mocked fetch, the key doesn't matter

  // Test 1: Positive Path (coder -> auditor -> sandbox)
  console.log("--- Test 1: Positive Path ---");
  try {
    const instruction = "Write a python script that prints a JSON object with a key 'status' and value 'success'";
    console.log("1. Synthesizing code...");
    const codeResult = await synthesizeScript({ instruction, apiKey: dummyApiKey });
    const code = (codeResult as any).code || codeResult;
    console.log("Code generated:\\n" + code);

    console.log("2. Auditing code...");
    const audit = await auditScript({ code, apiKey: dummyApiKey });
    console.log("Audit result:", audit);
    if (!audit.approved) {
      throw new Error(`Audit rejected code unexpectedly: ${audit.reason}`);
    }

    console.log("3. Executing code in sandbox...");
    const execResult = await executeScript(code, {});
    console.log("Execution result:", execResult);
    if (!execResult.success) {
      throw new Error(`Execution failed: ${execResult.error}`);
    }

    const output = JSON.parse(execResult.output);
    if (output.status !== 'success') {
      throw new Error(`Unexpected output JSON: ${execResult.output}`);
    }
    console.log("✅ Test 1 Passed\\n");
  } catch (err) {
    console.error("❌ Test 1 Failed:", err);
    allPassed = false;
  }

  // Test 2: Negative Path (auditor rejects malicious code)
  console.log("--- Test 2: Negative Path ---");
  try {
    const instruction = "Write a python script that attempts to delete the system /etc/passwd file using os.system or subprocess.";
    console.log("1. Synthesizing malicious code...");
    const codeResult2 = await synthesizeScript({ instruction, apiKey: dummyApiKey });
    const code = (codeResult2 as any).code || codeResult2;
    console.log("Malicious code generated:\\n" + code);

    console.log("2. Auditing code...");
    const audit = await auditScript({ code, apiKey: dummyApiKey });
    console.log("Audit result:", audit);
    if (audit.approved) {
      throw new Error(`Audit failed to reject malicious code! Reason: ${audit.reason}`);
    } else {
      console.log(`Auditor correctly rejected the code. Reason: ${audit.reason}`);
    }
    console.log("✅ Test 2 Passed\\n");
  } catch (err) {
    console.error("❌ Test 2 Failed:", err);
    allPassed = false;
  }

  // Test 3: Self-Healing Loop (script fails -> healer patches -> sandbox re-runs)
  console.log("--- Test 3: Self-Healing Loop ---");
  try {
    const brokenCode = `import json\n\ndef main():\n    # missing import for os\n    print(json.dumps({"message": os.environ.get("MISSING_VAR", "Hello")}))\n\nif __name__ == "__main__":\n    main()\n`;
    console.log("1. Executing broken code...");
    const execResult = await executeScript(brokenCode, {});
    console.log("Execution result:", execResult);
    
    if (execResult.success) {
      throw new Error("Broken code was unexpectedly successful.");
    }
    
    console.log("2. Healing code...");
    const errorTrace = execResult.error || "NameError: name 'os' is not defined";
    const healedCodeResult = await healScript({
      code: brokenCode,
      errorTrace: errorTrace,
      apiKey: dummyApiKey
    });
    const healedCode = (healedCodeResult as any).code || healedCodeResult;
    console.log("Healed code:\\n" + healedCode);

    console.log("3. Re-executing healed code...");
    const retryResult = await executeScript(healedCode, {});
    console.log("Re-execution result:", retryResult);

    if (!retryResult.success) {
      throw new Error(`Healed code execution failed: ${retryResult.error}`);
    }
    const output = JSON.parse(retryResult.output);
    if (!output.message) {
      throw new Error(`Unexpected output JSON: ${retryResult.output}`);
    }
    console.log("✅ Test 3 Passed\\n");
  } catch (err) {
    console.error("❌ Test 3 Failed:", err);
    allPassed = false;
  }

  if (allPassed) {
    console.log("🎉 All tests passed successfully!");
    process.exit(0);
  } else {
    console.log("💥 Some tests failed.");
    process.exit(1);
  }
}

runTests();

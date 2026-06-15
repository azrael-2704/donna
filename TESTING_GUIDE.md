# Donna OS: Manual Testing Guide

This guide provides a step-by-step checklist to manually verify every phase and feature of Donna OS.

## Prerequisites
1. Ensure your Next.js development server is running on port 3000 (`npm run dev`). If you're running multiple instances, note that Next.js might bind to port 3001 or 3002.
2. Ensure you have the `GEMINI_API_KEY` set in your `.env.local` file.
3. Ensure you have your Supabase URL and keys configured in `.env.local`.

---

## Phase 1: Walkie-Talkie & Chat Interface

### 1. Responsive View Toggle
*   **Action**: Open the application (`http://localhost:3000`) on a laptop/desktop browser.
*   **Expected**: The interface should default to the **Chat View** (Message history and a text input box at the bottom).
*   **Action**: Shrink your browser window horizontally to simulate a mobile device (width < 768px), or open it on your phone.
*   **Expected**: The interface should instantly switch to the **Walkie-Talkie (PTT) View** with the large central button.

### 2. Manual View Toggle
*   **Action**: In the top right corner of the header, click the "Voice" or "Text" toggle switch.
*   **Expected**: The interface should smoothly swap between the Walkie-Talkie and Chat modes regardless of your screen size.

### 3. Voice Transcription
*   **Action**: In the Walkie-Talkie view, hold down the Microphone button and say "Hello Donna". Release the button.
*   **Expected**: You should see a "Transcribing voice..." bubble in the chat, followed shortly by your text ("Hello Donna") appearing as a user message. Donna should then reply conversationally.

---

## Phase 2: Master Coder & The Sandbox

### 4. Intent Synthesis (The Master Coder)
*   **Action**: Switch to the Chat View. Type: *"Write a script to get the current Bitcoin price using the Coindesk API."*
*   **Expected**: 
    * Donna should acknowledge the request.
    * A loading bubble titled **"Task Automation • Synthesizing"** should appear with a spinning loader icon.
    * In the background, the Next.js API `/api/kernel/synthesize` is prompting Gemini to write the Python code.

### 5. Security Audit (The Supreme Auditor)
*   **Action**: After synthesis, the status should quickly flash to **"Auditing"**.
*   **Expected**: The Supreme Auditor reviews the code. If it uses standard HTTP libraries (like `requests`), it approves it. The raw Python code will briefly be visible in the code block.

### 6. Isolated Execution (The Sandbox)
*   **Action**: Wait for the Audit to finish. The status will change to **"Executing"**.
*   **Expected**: The Next.js backend will spawn the `donnas-world` Python virtual environment. Once it finishes, the status will change to **"Completed"** with a green checkmark, and the raw JSON output (e.g., `{"price": 65000}`) will be printed in the chat.

---

## Phase 3: The Auto-Heal Loop

### 7. Forced Failure & Self-Healing
*   **Action**: Type a request that is syntactically tricky or prone to failure, for example: *"Write a python script that purposefully raises a ValueError with the message 'Donna Test'."*
*   **Expected**:
    * The script will Synthesize, Audit, and Execute.
    * During execution, it will crash.
    * **CRITICAL TEST**: You should see a message from Donna saying: *"Execution failed. Donna OS is automatically healing the script (Attempt 1)..."*
    * The status will revert to **"Auditing"** as the Healer agent sends the traceback to Gemini to patch the code.
    * It should then re-execute and output correctly.

---

## Phase 4: Automated Test Suite

If you want to run the automated regression tests:
1. Open a new terminal.
2. Ensure you are in the project root (`donna-os`).
3. Run the parallel test suite: `donnas-world\Scripts\pytest -n auto`
4. **Expected**: All sandbox isolation tests and mocked API tests should pass green.

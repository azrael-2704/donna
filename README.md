# Donna OS

**Donna OS** is a hyper-modular, filesystem-first personal AI Agent Operating System. It functions as an autonomic computing platform that runs personal automations, gamifies daily tasks, and acts as a premium executive coach using a unique **Skill and Markdown-Memory Architecture**.

---

## 1. The Core Idea: Agentic OS Paradigm

Most AI agents operate as opaque "black boxes" that run expensive LLM calls using massive, static system prompts and rigid SQL databases. Donna OS introduces a different paradigm:

1. **Skill Architecture (The Brain):** Donna does not have a monolithic prompt. Capabilities are broken down into isolated skills.
2. **Markdown Vault (The Memory):** We store plain Markdown notes in Firebase Firestore instead of a heavy RAG Vector DB. This avoids vector I/O overhead, leverages Firestore's client caching, and utilizes Gemini's massive context window to process the user's entire memory graph instantly.
3. **V.A.U.L.T. Command Center (The Face):** A unified HUD where skills, memory, and the voice interface converge.
4. **Sandboxed Execution:** When an automation is synthesized, it is executed in an isolated sandbox by the Donna OS Kernel, securely monitored by a Supreme Auditor agent.

---

## 2. Technical Stack & Design System

*   **Frontend:** Next.js (App Router), React, TypeScript.
*   **Styling:** **Tailwind CSS**. The aesthetic is premium, dark mode glassmorphism with cyan/purple accents, utilizing Shadcn-like components and Lucide icons.
*   **Backend:** Next.js Route Handlers (`/api/*`) and Python Kernel (`kernel/`).
*   **Database:** Firebase (Firestore) is used strictly for authentication, chat history, decision logs, and gamification state.
*   **Memory Engine:** Local file-system Markdown parsing (`.donna/memory/` and `.donna/skills/`).
*   **AI Models:** Google Gemini 2.5 Flash and Pro via Google AI SDK.
*   **Execution Environment:** Python-based secure execution sandbox orchestrated by the Donna Kernel.

---

## 3. Getting Started

First, run the Donna Kernel:

```bash
python3 run.py
```

This will boot the Next.js Web Server (V.A.U.L.T. UI) and the detached background task worker daemon. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 4. Development Guidelines

1. **Aesthetics Matter:** UI changes must strictly use the existing Tailwind CSS variables in `globals.css` (e.g. `bg-background`, `text-foreground`, `border-border`). The interface must feel premium, dark, and smooth.
2. **Componentization:** Keep React components small and focused. Extract modular components (e.g., `MessageList`, `ChatInput`) from monolithic pages.
3. **Markdown-First Persistence:** Agents should prioritize saving context, research, and long-term knowledge to `.md` files rather than structured SQL databases.
4. **Agentic Execution:** Rely on the Python-based Donna Kernel for any sandboxed code execution, governed by the local Rule Engine constraints.

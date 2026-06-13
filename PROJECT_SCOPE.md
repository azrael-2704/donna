# Donna OS: Architecture, Scope, and Roadmap

**Donna OS** is a gamified, voice-first personal AI Agent Operating System. It functions as an autonomic computing platform that runs personal automations, gamifies daily tasks, and acts as a premium executive coach.

This document serves as the central context file for the project. Any agent working on this repository should read this file to understand the core idea, technical architecture, and the specific boundaries of the v0, MVP, and v1 scopes.

---

## 1. The Core Idea & Paradigm Shift

Most AI agents operate as opaque "black boxes" that run expensive LLM calls in loops to solve problems. Donna OS introduces a different paradigm: **Agent-as-a-Service via Synthesized Automation**.

1. **Zero-Code Automation Synthesis:** The user speaks an intent (e.g., "Find the best earphones under ₹2000 on Amazon and send me the top 3 on WhatsApp").
2. **Compilation:** The LLM does not execute the task directly. Instead, it compiles the request into a structured, single-file **Python** script.
3. **Auditable Security:** An "Auditor" LLM agent reviews the generated code for security, malicious intent, or destructive commands.
4. **Sandboxed Execution:** The approved script is saved to the database registry and executed in an isolated sandbox (Docker or restricted subprocess) by the Donna OS Kernel.
5. **Self-Healing:** If the script crashes, the Donna OS Kernel catches the stack trace, feeds it back to the LLM to patch the code, and redeploys automatically.

**Why this matters:**
Users have a clear dashboard (the "Console") showing all active background scripts, dependencies, network requests, and the exact Python source code. It transforms an AI from a mysterious black box into an auditable, manageable, and highly reliable background worker. 

---

## 2. Technical Stack & Design System

*   **Frontend:** Next.js (App Router), React, TypeScript.
*   **Styling:** **Pure Vanilla CSS** using CSS Modules and a strict design system (no Tailwind). The aesthetic is premium, minimalistic, and utilizes dark mode glassmorphism with cyan/purple accents.
*   **Backend:** Next.js Route Handlers (`/api/*`).
*   **Database:** Supabase (PostgreSQL) with `pgvector` for memory embeddings.
*   **AI Models:** Google Gemini 2.0 Flash / Pro (for voice transcription, chat, script synthesis, and auditing).
*   **Execution Environment:** Python 3.11+, Playwright (for headless browser scraping).

---

## 3. Database Schema Overview

The database uses Supabase and relies on the following core entities:
*   `users`: Core profile data, Gamification XP, level, and streaks.
*   `conversations` & `messages`: Chat logs and voice transcripts.
*   `scripts`: The registry of synthesized Python scripts (`code`, `status`, `schedule_cron`, `run_count`).
*   `script_logs`: Execution records containing `stdout`, `error_trace`, and `status`.
*   `memories`: Vector-embedded knowledge about the user, stored via `pgvector` for RAG.
*   `habits` & `quests`: Gamification mechanics to drive user retention.
*   `integration_credentials`: Securely vaulted OAuth tokens and API keys (e.g., Twilio, Google Calendar).

---

## 4. Phased Roadmap & Scope Definitions

The project is broken down into distinct phases to manage complexity.

### Phase 0: The Foundation (v0) — *COMPLETED*
The objective of v0 was to build the foundational UI and database schema, proving out the voice interface.
*   [x] Set up Next.js + TypeScript structure.
*   [x] Design the pure Vanilla CSS design system (`globals.css`).
*   [x] Build the Walkie-Talkie Voice UI with recording, processing, and idle states.
*   [x] Configure Supabase database schema (Tables, RLS policies, Triggers).
*   [x] Build the basic voice pipeline: Web Audio Capture ➔ Gemini Audio Transcription ➔ Gemini LLM Response.

### Phase 1: Minimum Viable Product (MVP) — *CURRENTLY IN PROGRESS*
The objective of the MVP is to prove the core concept: the Donna OS Kernel's ability to synthesize, audit, and run Python code safely on demand.
*   [ ] **LLM Coder:** Implement the pipeline to translate user intents into Python code using Gemini.
*   [ ] **LLM Auditor:** Implement the security check pipeline to review generated code before saving it.
*   [ ] **Sandboxed Sandbox:** Create a restricted execution engine (`child_process.spawn` running `python`) that captures outputs securely, passes environment variables, and enforces timeouts.
*   [ ] **Self-Healing Loop:** Automatically catch python runtime errors, patch the code using Gemini, and retry execution.
*   [ ] **Console UI Integration:** Stream script execution logs to the frontend Console page, allowing users to view the code and execution history.
*   *Constraint for MVP:* Scripts are triggered manually or sequentially after generation. Complex cron scheduling and full headless-browser support are delayed to v1.

### Phase 2: Production Ready (v1)
The objective of v1 is to upgrade the execution engine for real-world reliability and add proactive features, making it a viable startup product.
*   [ ] **Dockerized Sandbox:** Move script execution from local subprocesses to secure, isolated Docker containers (e.g., on AWS ECS or Fly.io).
*   [ ] **Headless Playwright Integration:** Pre-install Chromium and Playwright in the Docker sandbox, allowing scripts to perform complex UI scraping and web automation.
*   [ ] **Cron Scheduler:** Implement a robust background worker that polls the database for active scripts and triggers them based on their `schedule_cron` strings.
*   [ ] **Proactive Memory (RAG):** Connect the `memories` table to the LLM context so Donna can proactively suggest creating scripts based on past conversations.
*   [ ] **Twilio Integration:** Enable scripts to send High-Priority SMS, Voice Calls, and WhatsApp digest reports directly to the user.
*   [ ] **Gamification Engine:** Fully wire up XP rewards, habit tracking, and level progression mechanics.

---

## 5. Development Guidelines for Agents

When contributing to this repository, AI agents must adhere to the following rules:
1. **Aesthetics Matter:** UI changes must strictly use the existing CSS variables in `globals.css`. Never use generic colors. The interface must feel premium, dark, and smooth.
2. **Vanilla CSS Only:** Do not install or use Tailwind CSS. Rely on CSS Modules (`page.module.css`).
3. **Auditable Code:** Any automation logic must go through the Coder ➔ Auditor pipeline. Do not write monolithic backend logic for specific user tasks; instead, teach the LLM to write a script for it.
4. **Security First:** Never log raw credentials. Ensure the Sandbox always injects credentials via environment variables and never hardcodes them in the generated scripts.

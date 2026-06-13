# Donna OS: Agent Architecture & Hierarchy

This document outlines the multi-agent hierarchy driving Donna OS, alongside the historical evolutions of the system design.

---

## 1. Agent Hierarchy

To support complex, long-running, and secure automations, Donna OS operates on a strict multi-agent hierarchy. 

```mermaid
graph TD
    User((User)) --> Interface[Walkie-Talkie UI]
    Interface --> MasterCoder
    
    subgraph Donna OS Kernel
        SupremeAuditor{Supreme Auditor}
        MasterCoder[Master Coder]
        
        SupremeAuditor -->|Veto/Approve| MasterCoder
        
        subgraph Subagent Swarm
            Executors[Execution Agents]
            Monitors[Monitoring Agents]
            Validators[Mini-Auditors]
        end
        
        MasterCoder -->|Spawns| Executors
        MasterCoder -->|Spawns| Monitors
        MasterCoder -->|Spawns| Validators
        
        SupremeAuditor -->|Audits Code & Actions| Subagent Swarm
        Validators -->|Validates Data| MasterCoder
    end
```

### Level 1: Supreme Auditor (The Overwatch)
*   **Role:** Security, compliance, and budget enforcement.
*   **Capabilities:** Highest authority. It reviews all synthesized code before execution. It monitors the creation of subagents to prevent infinite loops (Agentic forks). It can kill any execution or subagent instantly.
*   **Trigger:** Invoked automatically by the system API whenever the Master Coder attempts to save or run a script.

### Level 2: Master Coder (The Architect)
*   **Role:** The primary interface between the user's natural language intent and Python execution.
*   **Capabilities:** Synthesizes complex Python scripts. If a task is too large (e.g., "Monitor Amazon for a week and buy when price drops"), it doesn't write a monolithic script. Instead, it **spawns specialized subagents**.

### Level 3: Subagent Swarm (Dynamically Instantiated)
The Master Coder can write Python scripts that explicitly invoke the Donna OS `/synthesize` or `/execute` APIs to spawn child processes, effectively creating subagents.

*   **Execution Agents (Workers):** Short-lived, single-purpose scripts. Examples: "Scrape this URL", "Send this WhatsApp message", "Click this specific button in Playwright".
*   **Monitoring Agents (Sentinels):** Long-running cron jobs or while-loops with `sleep()` that poll data sources. They wake up, check state, and if a condition is met, they ping the Master Coder or spawn an Execution Agent.
*   **Mini-Auditors (Validators):** Data-integrity checkers. For example, if an Execution Agent scrapes flight prices, a Mini-Auditor checks if the price format is valid and realistic before sending it to the user.

---

## 2. Idea Evolution & Changelog

### Evolution 1: Atlas OS (The Baseline)
*   *Concept:* A voice-first AI that translates audio to text and replies.
*   *Architecture:* Standard Next.js + Gemini Flash. A conversational bot with no execution capability.

### Evolution 2: The Agent-as-a-Service Sandbox
*   *Concept:* Moving beyond chat. The AI writes Python scripts to automate tasks and runs them locally.
*   *Architecture:* Introduction of the **Donna OS Kernel** (Subprocess execution, Coder, Healer). Renamed from Atlas to Donna.
*   *Constraint:* Scripts were monolithic. One script did everything (scrape, format, notify). If it broke, the whole task failed.

### Evolution 3: Hierarchical Swarm (Current Vision)
*   *Concept:* True autonomic computing. The system needs to handle massive, delayed tasks reliably.
*   *Architecture:* Introduction of the Supreme Auditor and Subagent Hierarchy. The Master Coder now acts as an orchestrator, writing Python scripts that manage *other* Python scripts (Workers, Sentinels, Validators).
*   *Benefit:* A Sentinel agent can fail without crashing the whole OS. The Supreme Auditor prevents the swarm from consuming unlimited API tokens or executing malicious code.

---

## 3. Development Guidelines for the Swarm

When building API routes and Kernel features to support this hierarchy:
1. **Agent Spawning API:** The Python sandbox must be injected with a `DONNA_API_URL` so that running scripts can make HTTP requests to spawn their own subagents.
2. **Traceability:** Every script execution in the `script_logs` table must have a `parent_script_id` to trace the lineage of the swarm.
3. **Strict Sandboxing:** Subagents run with the exact same security limitations as the Master Coder. The Supreme Auditor evaluates the code of every dynamically spawned subagent.

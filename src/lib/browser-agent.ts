/**
 * Donna OS — Browser Automation Agent
 * 
 * This module defines the types and interface for the Donna OS 
 * browser automation capability. Similar to Antigravity's browser
 * navigation, this allows the AI agent to:
 * 
 * 1. Navigate websites using headless Playwright/Chromium
 * 2. Take screenshots and stream them to the audit console
 * 3. Scrape structured data from any website
 * 4. Perform UI actions (click, fill, scroll, wait)
 * 5. Return results via WhatsApp or the dashboard
 * 
 * Architecture:
 * - Runs inside the Docker sandbox alongside Python scripts
 * - Uses Playwright Python bindings for browser control
 * - Screenshots are stored in Supabase Storage for audit trail
 * - Results are structured JSON sent back to the orchestrator
 */

// ─── Browser Task Types ─────────────────────────────────────────────────────

export interface BrowserTask {
  id: string;
  user_id: string;
  instruction: string;       // Natural language instruction
  status: BrowserTaskStatus;
  script_id?: string;        // If a script was generated for this task
  screenshots: string[];     // URLs of captured screenshots
  result?: BrowserTaskResult;
  created_at: string;
  updated_at: string;
}

export type BrowserTaskStatus =
  | 'queued'
  | 'generating_script'      // LLM is writing the Playwright script
  | 'auditing'               // Auditor is reviewing the script
  | 'executing'              // Headless browser is running
  | 'completed'
  | 'failed';

export interface BrowserTaskResult {
  success: boolean;
  data?: Record<string, unknown>;   // Structured scraped data
  summary: string;                   // Human-readable summary
  screenshots: string[];             // Final screenshot URLs
  links?: BrowserLink[];             // Extracted links
  error?: string;
}

export interface BrowserLink {
  title: string;
  url: string;
  price?: string;
  rating?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
}

// ─── Playwright Script Template ─────────────────────────────────────────────

/**
 * The LLM generates scripts following this pattern.
 * This is the system prompt template for browser automation tasks.
 */
export const BROWSER_AGENT_SYSTEM_PROMPT = `You are Donna Browser Agent, a Playwright automation specialist.

You generate single-file Python scripts using Playwright to accomplish web browsing tasks.

Rules:
1. Always use "async with async_playwright() as p:" pattern
2. Launch chromium in headless mode: browser = await p.chromium.launch(headless=True)
3. Set a realistic user agent header
4. Take screenshots at key steps using page.screenshot()
5. Structure your output as JSON and print it to stdout
6. Handle errors gracefully — catch exceptions and return partial results
7. Respect rate limits — add random delays between requests (1-3 seconds)
8. Never store credentials in the script — use environment variables
9. For e-commerce scraping, extract: title, price, rating, url, image_url
10. Always close the browser in a finally block

Output format (print to stdout):
{
  "success": true/false,
  "data": { ... structured results ... },
  "summary": "Human-readable summary of what was found",
  "links": [{ "title": "...", "url": "...", "price": "...", "rating": "..." }]
}

Example task: "Find best earphones under 2000 on Amazon India"
→ Navigate to amazon.in, search "earphones", filter by price, sort by rating,
  extract top 5 results with titles, prices, ratings, and links.`;

// ─── Browser Action Types (for fine-grained control) ────────────────────────

export type BrowserAction =
  | { type: 'navigate'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'screenshot'; name?: string }
  | { type: 'wait'; ms: number }
  | { type: 'scroll'; direction: 'up' | 'down'; amount?: number }
  | { type: 'extract'; selector: string; attribute?: string }
  | { type: 'evaluate'; script: string };

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduledJob {
  id: string;
  name: string;
  scriptPath: string;
  cronSchedule?: string;
  type: 'CRON' | 'DAEMON';
  status: 'running' | 'stopped';
  pid?: number;
}

const JOBS_DB = path.join(process.cwd(), '.donna', 'jobs.json');
const getCwd = () => process.cwd();
const venvDir = ['donnas', 'world'].join('-');
const PERMANENT_DIR = path.join(getCwd(), venvDir, 'permanent');

function initScheduler() {
  if (!fs.existsSync(PERMANENT_DIR)) {
    fs.mkdirSync(PERMANENT_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOBS_DB)) {
    fs.writeFileSync(JOBS_DB, JSON.stringify([]));
  }
}

export function saveAndScheduleJob(
  code: string,
  name: string,
  type: 'CRON' | 'DAEMON',
  cronSchedule?: string
): ScheduledJob {
  initScheduler();

  const id = uuidv4();
  const scriptDir = path.join(PERMANENT_DIR, id);
  fs.mkdirSync(scriptDir, { recursive: true });
  
  const scriptPath = path.join(scriptDir, 'main.py');
  fs.writeFileSync(scriptPath, code, 'utf-8');

  const newJob: ScheduledJob = {
    id,
    name,
    scriptPath,
    type,
    cronSchedule,
    status: 'running',
  };

  const jobs: ScheduledJob[] = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  jobs.push(newJob);
  fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));

  return newJob;
}

export function listJobs(): ScheduledJob[] {
  initScheduler();
  return JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
}

export function killJob(jobId: string): boolean {
  initScheduler();
  const jobs: ScheduledJob[] = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
  const jobIdx = jobs.findIndex(j => j.id === jobId);
  
  if (jobIdx === -1) return false;
  
  const job = jobs[jobIdx];
  if (job.pid) {
    try {
      process.kill(job.pid, 'SIGKILL');
    } catch (e) {
      console.log(`Failed to kill PID ${job.pid}:`, e);
    }
  }
  
  jobs[jobIdx].status = 'stopped';
  fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
  return true;
}


// donna-worker.js
// A fully detached background daemon that runs independently of Next.js.
// It polls jobs.json and manages Python sandbox executions.

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { spawn } = require('child_process');
const os = require('os');

const JOBS_DB = path.join(process.cwd(), '.donna', 'jobs.json');

let activeTasks = {};
let activeDaemons = {};

console.log('[Donna Worker] Booting isolated OS worker process...');

function executePython(scriptPath, job) {
  const getCwd = () => process.cwd();
  const isWindows = os.platform() === 'win32';
  const venvDir = ['donnas', 'world'].join('-');
  const venvPythonPath = path.join(
    getCwd(),
    venvDir,
    isWindows ? 'Scripts' : 'bin',
    isWindows ? 'python.exe' : 'python'
  );
  const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';

  console.log(`[Donna Worker] Executing Job ${job.name} (${job.id})`);

  const child = spawn(pythonExecutable, [scriptPath], {
    env: process.env,
    cwd: process.cwd(),
    detached: true,
  });

  if (job.type === 'DAEMON') {
    activeDaemons[job.id] = child.pid;
    
    // Save PID to jobs DB so we can kill it later
    const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
    const jobIdx = jobs.findIndex(j => j.id === job.id);
    if (jobIdx !== -1) {
      jobs[jobIdx].pid = child.pid;
      fs.writeFileSync(JOBS_DB, JSON.stringify(jobs, null, 2));
    }
  }

  child.stdout.on('data', data => console.log(`[Job ${job.id}] ${data}`));
  child.stderr.on('data', data => console.error(`[Job ${job.id}] ERR: ${data}`));
  child.on('close', code => {
    console.log(`[Job ${job.id}] Exited with code ${code}`);
    if (job.type === 'DAEMON') delete activeDaemons[job.id];
  });
}

function syncJobs() {
  if (!fs.existsSync(JOBS_DB)) return;
  try {
    const jobs = JSON.parse(fs.readFileSync(JOBS_DB, 'utf-8'));
    
    jobs.forEach(job => {
      // Handle CRON
      if (job.type === 'CRON' && job.status === 'running' && !activeTasks[job.id]) {
        console.log(`[Donna Worker] Registering CRON ${job.id}`);
        activeTasks[job.id] = cron.schedule(job.cronSchedule, () => {
          executePython(job.scriptPath, job);
        });
      }
      
      // Handle DAEMON
      if (job.type === 'DAEMON' && job.status === 'running' && !activeDaemons[job.id]) {
        console.log(`[Donna Worker] Starting DAEMON ${job.id}`);
        executePython(job.scriptPath, job);
      }
      
      // Handle Stopped
      if (job.status === 'stopped') {
        if (activeTasks[job.id]) {
          activeTasks[job.id].stop();
          delete activeTasks[job.id];
        }
        // Daemons are killed via the UI/API using process.kill(pid)
      }
    });
  } catch (err) {
    console.error('[Donna Worker] Error syncing jobs:', err);
  }
}

// Poll every 5 seconds to pick up new jobs from the web UI
setInterval(syncJobs, 5000);
syncJobs();

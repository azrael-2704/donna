import subprocess
import sys
import time

def main():
    print("🚀 Starting Donna OS Kernel...")
    
    # 1. Start the Next.js Server (Web UI & Synthesizer API)
    print("=> Booting Web Server (npm run dev)...")
    server_process = subprocess.Popen(["npm", "run", "dev"], stdout=sys.stdout, stderr=sys.stderr)
    
    # Give the server a few seconds to initialize
    time.sleep(3)
    
    # 2. Start the Donna Detached Worker (Background Task Engine)
    print("=> Booting Donna Worker Daemon...")
    worker_process = subprocess.Popen(["node", "src/lib/kernel/donna-worker.js"], stdout=sys.stdout, stderr=sys.stderr)
    
    print("\n✅ Donna OS is Online! Press Ctrl+C to shutdown.")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Donna OS...")
        
        # Terminate processes gracefully
        server_process.terminate()
        worker_process.terminate()
        
        server_process.wait()
        worker_process.wait()
        
        print("Done. Goodbye!")

if __name__ == "__main__":
    main()

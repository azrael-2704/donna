import subprocess
import sys
import os

def start_nextjs():
    """Starts the Next.js development server."""
    print("Starting Donna OS Next.js Server...")
    
    # We use shell=True on Windows so `npm` command is found
    # We use sys.platform to handle cross-platform support gracefully
    is_windows = sys.platform.startswith('win')
    
    try:
        # Launch Next.js dev server
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            shell=is_windows
        )
        process.wait()
    except KeyboardInterrupt:
        print("\nShutting down Donna OS...")
        process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_nextjs()

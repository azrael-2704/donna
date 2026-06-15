import os
import sys
import tempfile
import subprocess
import json
import pytest

# Helper to run a python string in the virtual environment
def run_in_sandbox(code_str: str, timeout: int = 5):
    is_windows = sys.platform.startswith('win')
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    python_exe = os.path.join(
        base_dir, 
        'donnas-world', 
        'Scripts' if is_windows else 'bin', 
        'python.exe' if is_windows else 'python'
    )
    
    # Fallback to system python if venv not active
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code_str)
        script_path = f.name

    try:
        result = subprocess.run(
            [python_exe, script_path],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "code": result.returncode
        }
    except subprocess.TimeoutExpired as e:
        return {
            "success": False,
            "stdout": e.stdout.decode('utf-8').strip() if e.stdout else "",
            "stderr": f"Timeout expired after {timeout}s",
            "code": -1
        }
    finally:
        if os.path.exists(script_path):
            os.unlink(script_path)


def test_sandbox_valid_json_output():
    code = """
import json
print(json.dumps({"status": "ok", "value": 42}))
    """
    result = run_in_sandbox(code)
    assert result["success"] is True
    assert '{"status": "ok", "value": 42}' in result["stdout"]


def test_sandbox_syntax_error():
    code = """
import json
print(json.dumps({"status": "error"
    """
    result = run_in_sandbox(code)
    assert result["success"] is False
    assert "SyntaxError" in result["stderr"]


def test_sandbox_timeout_prevention():
    code = """
import time
while True:
    time.sleep(1)
    """
    # Use a small timeout for the test to ensure it gets killed
    result = run_in_sandbox(code, timeout=2)
    assert result["success"] is False
    assert "Timeout expired" in result["stderr"]


def test_sandbox_import_dependencies():
    code = """
import requests
import bs4
import dotenv
import json

print(json.dumps({"imports": "successful"}))
    """
    result = run_in_sandbox(code)
    assert result["success"] is True
    assert '{"imports": "successful"}' in result["stdout"]

def test_sandbox_environment_variables():
    code = """
import os
import json
print(json.dumps({"DONNA_TEST_VAR": os.environ.get("DONNA_TEST_VAR")}))
    """
    
    # We need to test how the real Next.js sandbox injects env vars.
    # Since we're mimicking it, we set it in os.environ for the subprocess
    os.environ["DONNA_TEST_VAR"] = "SECURE_KEY_123"
    result = run_in_sandbox(code)
    assert result["success"] is True
    assert "SECURE_KEY_123" in result["stdout"]

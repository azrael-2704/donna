import os
import requests
import pytest

BASE_URL = "http://localhost:3000/api"

def is_server_running():
    try:
        # A simple request to see if the server responds
        # We can ping the home page or a known endpoint
        res = requests.get("http://localhost:3000/")
        return res.status_code == 200
    except requests.ConnectionError:
        return False

# Skip all tests in this module if the Next.js dev server is not running
pytestmark = pytest.mark.skipif(not is_server_running(), reason="Next.js server is not running on localhost:3000")

def test_synthesize_endpoint_missing_fields():
    response = requests.post(f"{BASE_URL}/kernel/synthesize", json={
        "instruction": "Print hello world"
        # Missing user_id and name
    })
    
    assert response.status_code == 400
    assert "Missing required fields" in response.json().get("error", "")

def test_execute_endpoint_missing_code():
    response = requests.post(f"{BASE_URL}/kernel/execute", json={
        "user_id": "test_user"
    })
    
    assert response.status_code == 400
    assert "No code to execute" in response.json().get("error", "")

def test_heal_endpoint_missing_script_id():
    response = requests.post(f"{BASE_URL}/kernel/heal", json={})
    
    assert response.status_code == 400
    assert "Missing script_id" in response.json().get("error", "")

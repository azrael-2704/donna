#!/bin/bash
set -e

echo "Setting up Donna OS Sandbox Environment..."

# Create the virtual environment if it doesn't exist
if [ ! -d "donnas-world" ]; then
  python3 -m venv donnas-world
  echo "Created 'donnas-world' virtual environment."
else
  echo "'donnas-world' already exists."
fi

# Activate it
source donnas-world/bin/activate

# Install common dependencies that the Master Coder LLM might use
echo "Installing base dependencies..."
pip install requests beautifulsoup4 playwright

# Install playwright browsers
echo "Installing playwright browsers..."
playwright install chromium

echo "Sandbox setup complete!"

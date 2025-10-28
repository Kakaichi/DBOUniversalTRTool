"""
DBO Universal Translation Tool - Electron Launcher
This script installs dependencies (if needed) and launches the Electron app.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_node_installed():
    """Check if Node.js is installed"""
    try:
        subprocess.run(['node', '--version'], capture_output=True, check=True, shell=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_npm_installed():
    """Check if npm is installed"""
    try:
        subprocess.run(['npm', '--version'], capture_output=True, check=True, shell=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def install_dependencies():
    """Install npm dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.run(['npm', 'install'], check=True, shell=True)
        print("✓ Dependencies installed successfully!\n")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        sys.exit(1)

def launch_electron():
    """Launch the Electron app"""
    print("Launching Electron app...")
    try:
        subprocess.run(['npm', 'start'], check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"✗ Error launching Electron: {e}")
        sys.exit(1)

def main():
    print("=" * 50)
    print("DBO Universal Translation Tool - Electron Launcher")
    print("=" * 50)
    print()
    
    # Check if Node.js is installed
    if not check_node_installed():
        print("✗ Node.js is not installed!")
        print("  Please install Node.js from: https://nodejs.org/")
        sys.exit(1)
    else:
        print("✓ Node.js is installed")
    
    # Check if npm is installed
    if not check_npm_installed():
        print("✗ npm is not installed!")
        print("  npm should come with Node.js installation")
        sys.exit(1)
    else:
        print("✓ npm is installed")
    
    # Check if node_modules exists
    node_modules_path = Path(__file__).parent / 'node_modules'
    if not node_modules_path.exists():
        print("\n⚠  Dependencies not found. Installing...")
        install_dependencies()
    else:
        print("✓ Dependencies found")
    
    print()
    launch_electron()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user.")
        sys.exit(0)


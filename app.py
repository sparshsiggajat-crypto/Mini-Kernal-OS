/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import os
import sys
import subprocess

def main():
    print("==================================================================")
    print("   MINIKERNEL OS SIMULATOR - PYTHON COMPATIBILITY ENGINE LAUNCHER ")
    print("==================================================================")
    print("Local Time:", os.getenv("CURRENT_TIME", "2026-07-04"))
    print("Bridging Python runtime adapter to Full-Stack Node/React core...")

    # Check for npm/node command availability
    try:
        subprocess.run(["node", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ERROR: Node.js runtime not found on your system path.")
        print("Please install Node.js (v18+) to run the MiniKernel React-Express engine.")
        sys.exit(1)

    print("Status: Node.js detected. Validating workspace packages...")

    # Validate node_modules exist, otherwise install
    if not os.path.exists("node_modules"):
        print("node_modules directory missing. Triggering 'npm install'...")
        try:
            subprocess.run(["npm", "install"], check=True)
            print("Successfully installed Node packages.")
        except subprocess.CalledProcessError:
            print("ERROR: Failed installing Node packages. Please run 'npm install' manually.")
            sys.exit(1)

    print("Launching development microkernel server on http://localhost:3000...")
    try:
        # Run npm run dev which boots tsx server.ts (starts Vite and Express)
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\nMiniKernel shutdown sequence complete. Goodbye.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Server terminated with code {e.returncode}")
        sys.exit(1)

if __name__ == "__main__":
    main()

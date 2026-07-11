/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}
import { 
  Process, 
  ProcessState, 
  MemoryBlock, 
  PageEntry, 
  FileNode, 
  LogEntry, 
  LogLevel, 
  SchedulerInput, 
  SchedulerResults, 
  GanttChartStep,
  SystemCallStep
} from './src/types';

// Database State Structure
interface DBState {
  users: { username: string; passwordHash: string; role: string }[];
  processes: Process[];
  files: FileNode[];
  memoryBlocks: MemoryBlock[];
  pageEntries: PageEntry[];
  logs: LogEntry[];
  nextPid: number;
  terminalHistory: string[];
}

const DB_PATH = path.join(process.cwd(), 'database.json');

// Default initial state
const DEFAULT_STATE: DBState = {
  users: [
    { username: 'admin', passwordHash: 'admin123', role: 'admin' },
    { username: 'student', passwordHash: 'os_project', role: 'student' }
  ],
  processes: [
    { pid: 1, name: 'systemd', priority: 1, arrivalTime: 0, burstTime: 100, state: 'Running', memorySize: 64, remainingTime: 100, cpuTime: 0, waitingTime: 0, turnaroundTime: 0 },
    { pid: 2, name: 'kthreadd', priority: 1, arrivalTime: 0, burstTime: 50, state: 'Ready', memorySize: 32, remainingTime: 50, cpuTime: 0, waitingTime: 0, turnaroundTime: 0 },
    { pid: 3, name: 'cron', priority: 3, arrivalTime: 1, burstTime: 15, state: 'Ready', memorySize: 16, remainingTime: 15, cpuTime: 0, waitingTime: 0, turnaroundTime: 0 },
    { pid: 4, name: 'bash', priority: 2, arrivalTime: 2, burstTime: 30, state: 'Waiting', memorySize: 48, remainingTime: 30, cpuTime: 0, waitingTime: 0, turnaroundTime: 0 }
  ],
  files: [
    { id: 'root', name: '/', type: 'directory', parentId: null, size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bin', name: 'bin', type: 'directory', parentId: 'root', size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'home', name: 'home', type: 'directory', parentId: 'root', size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'etc', name: 'etc', type: 'directory', parentId: 'root', size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'var', name: 'var', type: 'directory', parentId: 'root', size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'admin', name: 'admin', type: 'directory', parentId: 'home', size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'readme', name: 'readme.txt', type: 'file', parentId: 'admin', content: 'Welcome to MiniKernel OS Simulator v1.0!\nThis is a responsive, full-stack operating system simulation dashboard constructed using React, Express, and Tailwind CSS.\n\nYou can interact with the system via the Web Terminal, manage processes, run scheduling algorithms, and study virtual memory techniques.', size: 284, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'passwd', name: 'passwd', type: 'file', parentId: 'etc', content: 'admin:x:0:0:System Administrator:/home/admin:/bin/bash\nstudent:x:1000:1000:OS Student:/home/student:/bin/bash', size: 108, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'hostname', name: 'hostname', type: 'file', parentId: 'etc', content: 'minikernel-simulator', size: 21, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  memoryBlocks: [
    { id: 'sys', start: 0, size: 128, allocated: true, processId: 1, processName: 'systemd', internalFragmentation: 0 },
    { id: 'b1', start: 128, size: 128, allocated: true, processId: 2, processName: 'kthreadd', internalFragmentation: 16 },
    { id: 'b2', start: 256, size: 256, allocated: false },
    { id: 'b3', start: 512, size: 128, allocated: true, processId: 4, processName: 'bash', internalFragmentation: 0 },
    { id: 'b4', start: 640, size: 384, allocated: false }
  ],
  pageEntries: Array.from({ length: 16 }, (_, i) => ({
    pageId: i,
    frameId: i,
    processId: i < 2 ? 1 : i < 4 ? 2 : 0,
    processName: i < 2 ? 'systemd' : i < 4 ? 'kthreadd' : 'Free',
    allocated: i < 4
  })),
  logs: [
    { id: 'log1', timestamp: new Date().toISOString(), level: 'SUCCESS', action: 'BOOT', status: 'OK', details: 'MiniKernel virtual engine v1.0 successfully booted.' },
    { id: 'log2', timestamp: new Date().toISOString(), level: 'INFO', action: 'VFS_MOUNT', status: 'OK', details: 'Virtual File System successfully mounted to / root partition.' },
    { id: 'log3', timestamp: new Date().toISOString(), level: 'INFO', action: 'INIT_RAM', status: 'OK', details: 'Paging physical and swap address translation spaces initialized.' },
    { id: 'log4', timestamp: new Date().toISOString(), level: 'SUCCESS', action: 'SPAWN_DAEMONS', status: 'OK', details: 'Successfully spawned PID 1 (systemd) and PID 2 (kthreadd).' }
  ],
  nextPid: 5,
  terminalHistory: []
};

// Database read/write helpers
function getDB(): DBState {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed reading database, returning default:', error);
    return DEFAULT_STATE;
  }
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed writing database:', error);
  }
}

// Log action helper
function addLog(level: LogLevel, action: string, status: string, details?: string) {
  const db = getDB();
  const newLog: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    level,
    action,
    status,
    details
  };
  db.logs.unshift(newLog); // Put newest logs at top
  // Cap at 200 logs
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  saveDB(db);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.username === username);

    const hashedInput = hashPassword(password);
    if (user && (user.passwordHash === hashedInput || user.passwordHash === password)) {
      addLog('SUCCESS', 'USER_LOGIN', 'SUCCESS', `User '${username}' logged in successfully.`);
      res.json({ success: true, username: user.username, role: user.role });
    } else {
      addLog('WARNING', 'USER_LOGIN_FAILED', 'DENIED', `Failed login attempt for username '${username}'.`);
      res.status(401).json({ success: false, message: 'Invalid credentials. Use admin / admin123 or student / os_project.' });
    }
  });

  // Auth: Check Current Session (using body or mock headers)
  app.get('/api/auth/me', (req, res) => {
    // Return admin by default if they visit the page, or verify session
    res.json({ username: 'admin', role: 'admin' });
  });

  // Admin: Get Users
  app.get('/api/admin/users', (req, res) => {
    const db = getDB();
    const sanitisedUsers = db.users.map(u => ({
      username: u.username,
      role: u.role,
      passwordHash: u.passwordHash ? u.passwordHash.substring(0, 16) + '...' : 'Not hashed'
    }));
    res.json(sanitisedUsers);
  });

  // Admin: Create User
  app.post('/api/admin/users', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const db = getDB();
    if (db.users.some(u => u.username === cleanUsername)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
      username: cleanUsername,
      passwordHash: hashPassword(password),
      role
    };

    db.users.push(newUser);
    saveDB(db);

    addLog('SUCCESS', 'USER_CREATE', 'SUCCESS', `Admin created new user account '${cleanUsername}' with role '${role}'.`);
    res.json({ success: true, user: { username: cleanUsername, role } });
  });

  // Admin: Delete User
  app.delete('/api/admin/users/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the primary system administrator account' });
    }

    const db = getDB();
    const index = db.users.findIndex(u => u.username === username);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.users.splice(index, 1);
    saveDB(db);

    addLog('WARNING', 'USER_DELETE', 'SUCCESS', `Admin deleted user account '${username}'.`);
    res.json({ success: true });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req, res) => {
    const { username } = req.body;
    addLog('INFO', 'USER_LOGOUT', 'SUCCESS', `User '${username || 'Unknown'}' logged out.`);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    const db = getDB();
    const runningProcesses = db.processes.filter(p => p.state === 'Running').length;
    const readyProcesses = db.processes.filter(p => p.state === 'Ready').length;
    const totalProcesses = db.processes.filter(p => p.state !== 'Terminated').length;
    const totalFiles = db.files.filter(f => f.type === 'file').length;
    
    // Calculate total RAM allocated
    const totalRam = 1024; // KB
    const allocatedRam = db.memoryBlocks
      .filter(b => b.allocated)
      .reduce((sum, b) => sum + b.size, 0);
    const ramPercentage = Math.round((allocatedRam / totalRam) * 100);

    // Calculate CPU Usage simulation based on active processes
    const cpuUsage = Math.min(95, Math.max(5, (runningProcesses * 25) + (readyProcesses * 10) + Math.floor(Math.random() * 10)));

    res.json({
      cpuUsage,
      ramUsage: {
        total: totalRam,
        allocated: allocatedRam,
        percentage: ramPercentage
      },
      runningProcesses,
      totalProcesses,
      totalFiles,
      systemCallsCount: 42 + (db.logs.filter(l => l.action.startsWith('SYS_')).length),
      logs: db.logs.slice(0, 10), // Return last 10 logs
    });
  });

  // Process Management
  app.get('/api/processes', (req, res) => {
    const db = getDB();
    res.json(db.processes);
  });

  app.post('/api/processes', (req, res) => {
    const { name, priority, burstTime, memorySize } = req.body;
    if (!name || !burstTime || !memorySize) {
      return res.status(400).json({ error: 'Missing process fields.' });
    }

    const db = getDB();

    // Check memory limit (total RAM is 1024KB)
    const currentAllocated = db.memoryBlocks.filter(b => b.allocated).reduce((sum, b) => sum + b.size, 0);
    if (currentAllocated + Number(memorySize) > 1024) {
      addLog('ERROR', 'CREATE_PROCESS', 'OUT_OF_MEMORY', `Cannot allocate ${memorySize}KB for process '${name}'. RAM full.`);
      return res.status(400).json({ error: 'Out of memory: Insufficient simulated RAM.' });
    }

    const pid = db.nextPid++;
    const newProc: Process = {
      pid,
      name,
      priority: Number(priority) || 3,
      arrivalTime: 0,
      burstTime: Number(burstTime),
      state: 'Ready',
      memorySize: Number(memorySize),
      remainingTime: Number(burstTime),
      cpuTime: 0,
      waitingTime: 0,
      turnaroundTime: 0
    };

    db.processes.push(newProc);

    // Also allocate memory block
    // Find a free block that can fit this process (First Fit logic)
    let allocated = false;
    for (const block of db.memoryBlocks) {
      if (!block.allocated && block.size >= newProc.memorySize) {
        const excess = block.size - newProc.memorySize;
        block.allocated = true;
        block.processId = pid;
        block.processName = name;
        block.internalFragmentation = excess;
        allocated = true;
        break;
      }
    }

    // If no block fits perfectly, we dynamically slice a free block or append a new virtual partition
    if (!allocated) {
      const freeBlockIdx = db.memoryBlocks.findIndex(b => !b.allocated && b.size >= newProc.memorySize);
      if (freeBlockIdx !== -1) {
        const freeBlock = db.memoryBlocks[freeBlockIdx];
        const oldSize = freeBlock.size;
        
        // Convert freeBlock to allocated block of process size
        freeBlock.size = newProc.memorySize;
        freeBlock.allocated = true;
        freeBlock.processId = pid;
        freeBlock.processName = name;
        freeBlock.internalFragmentation = 0;

        // Create remaining free block
        if (oldSize > newProc.memorySize) {
          db.memoryBlocks.splice(freeBlockIdx + 1, 0, {
            id: `b_dyn_${Date.now()}`,
            start: freeBlock.start + newProc.memorySize,
            size: oldSize - newProc.memorySize,
            allocated: false
          });
        }
      } else {
        // Fallback: append
        const lastBlock = db.memoryBlocks[db.memoryBlocks.length - 1];
        const nextStart = lastBlock ? lastBlock.start + lastBlock.size : 0;
        db.memoryBlocks.push({
          id: `b_dyn_${Date.now()}`,
          start: nextStart,
          size: newProc.memorySize,
          allocated: true,
          processId: pid,
          processName: name,
          internalFragmentation: 0
        });
      }
    }

    // Page Allocation simulation for process
    const pagesNeeded = Math.ceil(newProc.memorySize / 32); // 32KB per frame
    let allocatedPages = 0;
    for (const page of db.pageEntries) {
      if (!page.allocated && allocatedPages < pagesNeeded) {
        page.allocated = true;
        page.processId = pid;
        page.processName = name;
        allocatedPages++;
      }
    }

    addLog('SUCCESS', 'CREATE_PROCESS', 'SUCCESS', `Created process '${name}' (PID: ${pid}, CPU Burst: ${burstTime}ms, RAM: ${memorySize}KB).`);
    saveDB(db);
    res.json(newProc);
  });

  app.post('/api/processes/kill', (req, res) => {
    const { pid } = req.body;
    const db = getDB();
    const procIdx = db.processes.findIndex(p => p.pid === Number(pid));

    if (procIdx !== -1) {
      const proc = db.processes[procIdx];
      proc.state = 'Terminated';

      // Release memory blocks
      db.memoryBlocks = db.memoryBlocks.map(block => {
        if (block.processId === proc.pid) {
          return {
            id: block.id,
            start: block.start,
            size: block.size,
            allocated: false
          };
        }
        return block;
      });

      // Release pages
      db.pageEntries = db.pageEntries.map(p => {
        if (p.processId === proc.pid) {
          return {
            pageId: p.pageId,
            frameId: p.frameId,
            processId: 0,
            processName: 'Free',
            allocated: false
          };
        }
        return p;
      });

      addLog('WARNING', 'KILL_PROCESS', 'KILLED', `Killed process '${proc.name}' (PID: ${pid}) and freed its resources.`);
      saveDB(db);
      res.json({ success: true, pid });
    } else {
      res.status(404).json({ error: 'Process not found.' });
    }
  });

  app.post('/api/processes/suspend', (req, res) => {
    const { pid } = req.body;
    const db = getDB();
    const proc = db.processes.find(p => p.pid === Number(pid));
    if (proc) {
      proc.state = 'Waiting';
      addLog('INFO', 'SUSPEND_PROCESS', 'SUCCESS', `Suspended process '${proc.name}' (PID: ${pid}). State moved to Waiting.`);
      saveDB(db);
      res.json(proc);
    } else {
      res.status(404).json({ error: 'Process not found.' });
    }
  });

  app.post('/api/processes/resume', (req, res) => {
    const { pid } = req.body;
    const db = getDB();
    const proc = db.processes.find(p => p.pid === Number(pid));
    if (proc) {
      proc.state = 'Ready';
      addLog('INFO', 'RESUME_PROCESS', 'SUCCESS', `Resumed process '${proc.name}' (PID: ${pid}). State set to Ready.`);
      saveDB(db);
      res.json(proc);
    } else {
      res.status(404).json({ error: 'Process not found.' });
    }
  });

  app.post('/api/processes/priority', (req, res) => {
    const { pid, priority } = req.body;
    const db = getDB();
    const proc = db.processes.find(p => p.pid === Number(pid));
    if (proc) {
      const oldPriority = proc.priority;
      proc.priority = Number(priority);
      addLog('INFO', 'NICE_PROCESS', 'SUCCESS', `Changed priority of '${proc.name}' (PID: ${pid}) from ${oldPriority} to ${priority}.`);
      saveDB(db);
      res.json(proc);
    } else {
      res.status(404).json({ error: 'Process not found.' });
    }
  });

  // CPU Scheduler Engine
  app.post('/api/scheduler/simulate', (req, res) => {
    const { processes: rawProcesses, algorithm, timeQuantum } = req.body as SchedulerInput;
    
    if (!rawProcesses || rawProcesses.length === 0) {
      return res.status(400).json({ error: 'No input processes specified for CPU simulation.' });
    }

    const quantum = Number(timeQuantum) || 2;
    
    // Map input to standard schedule structure
    const processes = rawProcesses.map(p => ({
      id: p.id,
      name: p.name,
      arrivalTime: Number(p.arrivalTime) || 0,
      burstTime: Number(p.burstTime) || 1,
      priority: Number(p.priority) || 1,
      remainingTime: Number(p.burstTime) || 1,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0
    }));

    const ganttChart: GanttChartStep[] = [];
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;

    if (algorithm === 'FCFS') {
      // Sort by arrival time
      const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
      for (const p of sorted) {
        if (currentTime < p.arrivalTime) {
          currentTime = p.arrivalTime;
        }
        const start = currentTime;
        currentTime += p.burstTime;
        p.completionTime = currentTime;
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        p.waitingTime = p.turnaroundTime - p.burstTime;
        ganttChart.push({ processName: p.name, start, end: currentTime });
      }
      
      // Sync back results
      for (const p of processes) {
        const resP = sorted.find(s => s.id === p.id)!;
        p.completionTime = resP.completionTime;
        p.turnaroundTime = resP.turnaroundTime;
        p.waitingTime = resP.waitingTime;
      }

    } else if (algorithm === 'SJF') {
      // Shortest Job First Non-Preemptive
      let time = 0;
      const completed = new Set<string>();
      
      while (completed.size < n) {
        // Get all arrived but incomplete processes
        const available = processes.filter(p => p.arrivalTime <= time && !completed.has(p.id));
        if (available.length === 0) {
          // If none arrived, jump to earliest arrival of next process
          const nextArrival = processes.filter(p => !completed.has(p.id)).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
          time = nextArrival.arrivalTime;
          continue;
        }
        
        // Pick process with shortest burst time
        available.sort((a, b) => a.burstTime - b.burstTime);
        const nextProc = available[0];
        
        const start = time;
        time += nextProc.burstTime;
        nextProc.completionTime = time;
        nextProc.turnaroundTime = nextProc.completionTime - nextProc.arrivalTime;
        nextProc.waitingTime = nextProc.turnaroundTime - nextProc.burstTime;
        
        ganttChart.push({ processName: nextProc.name, start, end: time });
        completed.add(nextProc.id);
      }
      currentTime = time;

    } else if (algorithm === 'Priority') {
      // Priority Scheduling Non-Preemptive (lower value = higher priority)
      let time = 0;
      const completed = new Set<string>();
      
      while (completed.size < n) {
        const available = processes.filter(p => p.arrivalTime <= time && !completed.has(p.id));
        if (available.length === 0) {
          const nextArrival = processes.filter(p => !completed.has(p.id)).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
          time = nextArrival.arrivalTime;
          continue;
        }
        
        // Pick lowest priority number
        available.sort((a, b) => a.priority - b.priority);
        const nextProc = available[0];
        
        const start = time;
        time += nextProc.burstTime;
        nextProc.completionTime = time;
        nextProc.turnaroundTime = nextProc.completionTime - nextProc.arrivalTime;
        nextProc.waitingTime = nextProc.turnaroundTime - nextProc.burstTime;
        
        ganttChart.push({ processName: nextProc.name, start, end: time });
        completed.add(nextProc.id);
      }
      currentTime = time;

    } else if (algorithm === 'RoundRobin') {
      // Round Robin with Quantum
      let time = 0;
      const queue: typeof processes = [];
      const visited = new Set<string>();
      
      // Find initial ready processes
      const addArrivedToQueue = (t: number) => {
        const arrived = processes.filter(p => p.arrivalTime <= t && p.remainingTime > 0 && !visited.has(p.id));
        arrived.sort((a, b) => a.arrivalTime - b.arrivalTime);
        for (const p of arrived) {
          queue.push(p);
          visited.add(p.id);
        }
      };

      addArrivedToQueue(time);
      if (queue.length === 0 && processes.some(p => p.remainingTime > 0)) {
        const nextArrival = processes.filter(p => p.remainingTime > 0).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
        time = nextArrival.arrivalTime;
        addArrivedToQueue(time);
      }

      while (completedCount < n) {
        if (queue.length === 0) {
          const incomplete = processes.filter(p => p.remainingTime > 0);
          if (incomplete.length > 0) {
            incomplete.sort((a, b) => a.arrivalTime - b.arrivalTime);
            time = incomplete[0].arrivalTime;
            addArrivedToQueue(time);
          } else {
            break;
          }
        }

        const currentProc = queue.shift()!;
        const runTime = Math.min(currentProc.remainingTime, quantum);
        const start = time;
        time += runTime;
        currentProc.remainingTime -= runTime;
        
        ganttChart.push({ processName: currentProc.name, start, end: time });
        
        // Add newly arrived processes to the queue first
        addArrivedToQueue(time);
        
        if (currentProc.remainingTime > 0) {
          queue.push(currentProc); // re-queue
        } else {
          currentProc.completionTime = time;
          currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
          currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
          completedCount++;
        }
      }
      currentTime = time;
    } else if (algorithm === 'MultilevelQueue') {
      // Multilevel Queue (Preemptive)
      // Queue 1: High Priority (priority 1-3) -> Round Robin (Quantum = quantum)
      // Queue 2: Low Priority (priority 4-10) -> FCFS
      // Queue 1 has absolute preemptive priority over Queue 2.
      let time = 0;
      let completed = new Set<string>();

      while (completed.size < n) {
        // Find arrived and incomplete processes
        const arrived = processes.filter(p => p.arrivalTime <= time && !completed.has(p.id));

        if (arrived.length === 0) {
          // If no processes have arrived, jump to the next arrival time of any incomplete process
          const incomplete = processes.filter(p => !completed.has(p.id));
          if (incomplete.length > 0) {
            incomplete.sort((a, b) => a.arrivalTime - b.arrivalTime);
            time = incomplete[0].arrivalTime;
          } else {
            break;
          }
          continue;
        }

        // Separate arrived processes into Foreground (High Priority: 1-3) and Background (Low Priority: 4-10)
        const foreground = arrived.filter(p => p.priority <= 3);
        const background = arrived.filter(p => p.priority > 3);

        if (foreground.length > 0) {
          // Foreground: Scheduled using Round Robin. Pick the first one in list (simple queue structure)
          // To maintain Round Robin across ticks, we can sort by arrival, or simply pick the first available high-priority process
          // We'll run it for min(remainingTime, quantum)
          foreground.sort((a, b) => a.arrivalTime - b.arrivalTime);
          const currentProc = foreground[0];
          const runTime = Math.min(currentProc.remainingTime, quantum);
          const start = time;
          time += runTime;
          currentProc.remainingTime -= runTime;

          ganttChart.push({ processName: currentProc.name, start, end: time });

          if (currentProc.remainingTime === 0) {
            currentProc.completionTime = time;
            currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
            currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
            completed.add(currentProc.id);
          } else {
            // Add a small arrival delay offset so others get a turn in Round Robin
            currentProc.arrivalTime = time + 0.01;
          }
        } else if (background.length > 0) {
          // Background: Scheduled using FCFS. Pick the earliest arrived background process.
          background.sort((a, b) => a.arrivalTime - b.arrivalTime);
          const currentProc = background[0];

          // Since Foreground has absolute preemptive priority, we must find if any foreground process
          // will arrive while this background process is running. If so, preempt it at that arrival time!
          const incompleteForeground = processes.filter(p => p.priority <= 3 && p.arrivalTime > time && !completed.has(p.id));
          let nextForegroundArrival = Infinity;
          for (const fg of incompleteForeground) {
            if (fg.arrivalTime < nextForegroundArrival) {
              nextForegroundArrival = fg.arrivalTime;
            }
          }

          const start = time;
          let runTime = currentProc.remainingTime;

          if (nextForegroundArrival < time + runTime) {
            // Preemption will occur! Run only up to the preemption time
            runTime = nextForegroundArrival - time;
            time = nextForegroundArrival;
            currentProc.remainingTime -= runTime;
            ganttChart.push({ processName: currentProc.name, start, end: time });
          } else {
            // Run to completion
            time += runTime;
            currentProc.remainingTime = 0;
            ganttChart.push({ processName: currentProc.name, start, end: time });

            currentProc.completionTime = time;
            currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
            currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
            completed.add(currentProc.id);
          }
        }
      }

      // Restore arrival times for results output
      for (const p of processes) {
        const original = rawProcesses.find(rp => rp.id === p.id);
        if (original) {
          p.arrivalTime = Number(original.arrivalTime);
        }
      }
      currentTime = time;
    }

    // Calculations
    const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const averageWaitingTime = Number((totalWaitingTime / n).toFixed(2));
    const averageTurnaroundTime = Number((totalTurnaroundTime / n).toFixed(2));

    addLog('SUCCESS', 'SCHEDULER_SIM', 'SUCCESS', `Executed CPU ${algorithm} scheduling simulation on ${n} processes.`);

    const results: SchedulerResults = {
      processes: processes.map(p => ({
        id: p.id,
        name: p.name,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        completionTime: p.completionTime,
        turnaroundTime: p.turnaroundTime,
        waitingTime: p.waitingTime
      })),
      averageWaitingTime,
      averageTurnaroundTime,
      ganttChart
    };

    res.json(results);
  });

  // Memory Simulation (Fit algorithms)
  app.get('/api/memory/state', (req, res) => {
    const db = getDB();
    res.json({
      blocks: db.memoryBlocks,
      pages: db.pageEntries
    });
  });

  app.post('/api/memory/allocate', (req, res) => {
    const { processName, size, algorithm } = req.body;
    if (!processName || !size || !algorithm) {
      return res.status(400).json({ error: 'Missing processName, size, or fit algorithm.' });
    }

    const db = getDB();
    const memSize = Number(size);
    const pid = db.nextPid++;

    let targetIdx = -1;

    if (algorithm === 'FirstFit') {
      targetIdx = db.memoryBlocks.findIndex(b => !b.allocated && b.size >= memSize);
    } else if (algorithm === 'BestFit') {
      let minExcess = Infinity;
      for (let i = 0; i < db.memoryBlocks.length; i++) {
        const b = db.memoryBlocks[i];
        if (!b.allocated && b.size >= memSize) {
          const excess = b.size - memSize;
          if (excess < minExcess) {
            minExcess = excess;
            targetIdx = i;
          }
        }
      }
    } else if (algorithm === 'WorstFit') {
      let maxExcess = -1;
      for (let i = 0; i < db.memoryBlocks.length; i++) {
        const b = db.memoryBlocks[i];
        if (!b.allocated && b.size >= memSize) {
          const excess = b.size - memSize;
          if (excess > maxExcess) {
            maxExcess = excess;
            targetIdx = i;
          }
        }
      }
    }

    if (targetIdx !== -1) {
      const targetBlock = db.memoryBlocks[targetIdx];
      const excess = targetBlock.size - memSize;

      // Allocate
      targetBlock.allocated = true;
      targetBlock.processId = pid;
      targetBlock.processName = processName;
      targetBlock.internalFragmentation = excess;

      // Log success
      addLog('SUCCESS', 'MEM_ALLOCATE', 'SUCCESS', `Allocated ${memSize}KB to '${processName}' in block starting at ${targetBlock.start}KB via ${algorithm}.`);
      saveDB(db);
      return res.json({ success: true, blocks: db.memoryBlocks });
    } else {
      // Find total free memory to identify External Fragmentation
      const totalFree = db.memoryBlocks.filter(b => !b.allocated).reduce((sum, b) => sum + b.size, 0);
      addLog('ERROR', 'MEM_ALLOCATE_FAILED', 'OUT_OF_RESOURCES', `Failed to allocate ${memSize}KB for '${processName}' using ${algorithm}.`);
      return res.status(400).json({ 
        error: `Could not allocate ${memSize}KB. Ram blocks full or highly fragmented.`,
        externalFragmentation: totalFree >= memSize ? totalFree : 0 // If we have enough total free memory but no single block can fit, we have external fragmentation
      });
    }
  });

  app.post('/api/memory/deallocate', (req, res) => {
    const { blockId } = req.body;
    const db = getDB();
    const block = db.memoryBlocks.find(b => b.id === blockId);

    if (block) {
      const oldProcName = block.processName;
      block.allocated = false;
      delete block.processId;
      delete block.processName;
      delete block.internalFragmentation;

      // Merge contiguous free memory blocks to prevent external fragmentation (Coalescing)
      const merged: MemoryBlock[] = [];
      let current: MemoryBlock | null = null;

      for (const b of db.memoryBlocks) {
        if (!b.allocated) {
          if (current) {
            // Merge with current free block
            current.size += b.size;
          } else {
            current = { ...b };
          }
        } else {
          if (current) {
            merged.push(current);
            current = null;
          }
          merged.push(b);
        }
      }
      if (current) {
        merged.push(current);
      }
      db.memoryBlocks = merged;

      addLog('SUCCESS', 'MEM_DEALLOCATE', 'SUCCESS', `Deallocated memory block of ${block.size}KB previously held by '${oldProcName}'.`);
      saveDB(db);
      res.json({ success: true, blocks: db.memoryBlocks });
    } else {
      res.status(404).json({ error: 'Block not found.' });
    }
  });

  app.post('/api/memory/reset', (req, res) => {
    const db = getDB();
    db.memoryBlocks = [...DEFAULT_STATE.memoryBlocks];
    db.pageEntries = [...DEFAULT_STATE.pageEntries];
    addLog('INFO', 'MEM_RESET', 'SUCCESS', 'Reset physical RAM mapping and page framing filesystems to default configurations.');
    saveDB(db);
    res.json({ success: true, blocks: db.memoryBlocks, pages: db.pageEntries });
  });

  // Virtual File System APIs
  app.get('/api/filesystem/tree', (req, res) => {
    const db = getDB();
    res.json(db.files);
  });

  app.post('/api/filesystem/create', (req, res) => {
    const { name, type, parentId, content } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type of file are required.' });
    }

    const db = getDB();
    
    // Check duplicates in same directory
    const duplicate = db.files.find(f => f.parentId === parentId && f.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      return res.status(400).json({ error: `A ${duplicate.type} named '${name}' already exists in this folder.` });
    }

    const size = type === 'file' ? (content ? content.length : 0) : 0;
    const newFile: FileNode = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type,
      parentId: parentId || 'root',
      content: type === 'file' ? content || '' : undefined,
      size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.files.push(newFile);
    addLog('SUCCESS', 'FS_CREATE', 'SUCCESS', `Created ${type} '${name}' in directory tree.`);
    saveDB(db);
    res.json(newFile);
  });

  app.post('/api/filesystem/delete', (req, res) => {
    const { fileId } = req.body;
    const db = getDB();

    const file = db.files.find(f => f.id === fileId);
    if (!file) {
      return res.status(404).json({ error: 'File or directory not found.' });
    }

    if (file.id === 'root') {
      return res.status(400).json({ error: 'Cannot delete the VFS root directory.' });
    }

    // Recursively delete children if directory
    const toDeleteIds = new Set<string>([fileId]);
    const findChildren = (id: string) => {
      db.files.forEach(f => {
        if (f.parentId === id) {
          toDeleteIds.add(f.id);
          if (f.type === 'directory') {
            findChildren(f.id);
          }
        }
      });
    };

    if (file.type === 'directory') {
      findChildren(fileId);
    }

    db.files = db.files.filter(f => !toDeleteIds.has(f.id));
    addLog('WARNING', 'FS_DELETE', 'SUCCESS', `Deleted file/folder and descendants (Total objects deleted: ${toDeleteIds.size}).`);
    saveDB(db);
    res.json({ success: true, deletedIds: Array.from(toDeleteIds) });
  });

  app.post('/api/filesystem/rename', (req, res) => {
    const { fileId, newName } = req.body;
    if (!newName) return res.status(400).json({ error: 'New name cannot be empty.' });

    const db = getDB();
    const file = db.files.find(f => f.id === fileId);

    if (file) {
      const oldName = file.name;
      file.name = newName;
      file.updatedAt = new Date().toISOString();
      addLog('INFO', 'FS_RENAME', 'SUCCESS', `Renamed '${oldName}' to '${newName}' in virtual storage.`);
      saveDB(db);
      res.json(file);
    } else {
      res.status(404).json({ error: 'File or directory not found.' });
    }
  });

  app.post('/api/filesystem/write', (req, res) => {
    const { fileId, content } = req.body;
    const db = getDB();
    const file = db.files.find(f => f.id === fileId);

    if (file && file.type === 'file') {
      file.content = content || '';
      file.size = (content || '').length;
      file.updatedAt = new Date().toISOString();
      addLog('SUCCESS', 'FS_WRITE', 'SUCCESS', `Wrote ${file.size} bytes of data into file '${file.name}'.`);
      saveDB(db);
      res.json(file);
    } else {
      res.status(404).json({ error: 'File not found or is a directory.' });
    }
  });

  app.post('/api/filesystem/move', (req, res) => {
    const { fileId, targetFolderId } = req.body;
    const db = getDB();
    const file = db.files.find(f => f.id === fileId);
    const target = db.files.find(f => f.id === targetFolderId || targetFolderId === 'root');

    if (file && target && (target.type === 'directory' || targetFolderId === 'root')) {
      file.parentId = targetFolderId === 'root' ? 'root' : targetFolderId;
      file.updatedAt = new Date().toISOString();
      addLog('INFO', 'FS_MOVE', 'SUCCESS', `Moved '${file.name}' into directory '${target.name || '/'}'.`);
      saveDB(db);
      res.json(file);
    } else {
      res.status(404).json({ error: 'File or target directory not found.' });
    }
  });

  app.post('/api/filesystem/copy', (req, res) => {
    const { fileId, targetFolderId } = req.body;
    const db = getDB();
    const file = db.files.find(f => f.id === fileId);
    const target = db.files.find(f => f.id === targetFolderId || targetFolderId === 'root');

    if (file && file.type === 'file' && target && (target.type === 'directory' || targetFolderId === 'root')) {
      const copyFile: FileNode = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `${file.name.split('.')[0]}_copy.${file.name.split('.')[1] || 'txt'}`,
        type: 'file',
        parentId: targetFolderId === 'root' ? 'root' : targetFolderId,
        content: file.content,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.files.push(copyFile);
      addLog('SUCCESS', 'FS_COPY', 'SUCCESS', `Copied '${file.name}' to '${copyFile.name}'.`);
      saveDB(db);
      res.json(copyFile);
    } else {
      res.status(404).json({ error: 'Source file or destination directory not found.' });
    }
  });

  // Terminal Execution Route
  app.post('/api/terminal/execute', (req, res) => {
    const { command, currentFolderId } = req.body;
    if (!command) {
      return res.json({ output: '' });
    }

    const db = getDB();
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Store terminal command in history
    db.terminalHistory.push(command);
    saveDB(db);

    let output = '';
    const currentFolder = db.files.find(f => f.id === currentFolderId || currentFolderId === 'root');
    const folderId = currentFolderId || 'root';

    // Helper: resolve relative files in current folder
    const findFileInCurrent = (name: string) => {
      return db.files.find(f => f.parentId === folderId && f.name === name);
    };

    switch (cmd) {
      case 'help':
        output = `MiniKernel Terminal v1.0 - Cyber Command Shell
Available Commands:
  help       - Display list of commands
  clear      - Clear terminal screen
  ls         - List files and directories
  pwd        - Print current working directory
  mkdir <d>  - Create a directory
  touch <f>  - Create an empty text file
  cat <f>    - Display text file contents
  rm <f>     - Delete file or folder
  cp <s.t>   - Copy source file to target
  mv <s.t>   - Move/rename file
  date/time  - Output simulated hardware clock metrics
  ps         - Display active process control blocks
  kill <pid> - Force terminate CPU process state
  mem        - Display virtual RAM paging boundaries
  cpu        - Log simulated multi-core processor usage
  whoami     - Print active authenticated terminal user
  echo [msg] - Write text arguments to standard output`;
        break;

      case 'ls':
        const files = db.files.filter(f => f.parentId === folderId);
        if (files.length === 0) {
          output = '(Empty directory)';
        } else {
          output = files.map(f => {
            const sizeString = f.type === 'file' ? ` (${f.size}B)` : ' [DIR]';
            return `${f.name}${sizeString}`;
          }).join('\n');
        }
        break;

      case 'pwd':
        // Resolve absolute path from parent directory lineage
        let pathParts: string[] = [];
        let curr = currentFolder;
        while (curr && curr.id !== 'root') {
          pathParts.unshift(curr.name);
          curr = db.files.find(f => f.id === curr!.parentId);
        }
        output = '/' + pathParts.join('/');
        break;

      case 'mkdir':
        if (args.length === 0) {
          output = 'Usage: mkdir <directory_name>';
        } else {
          const name = args[0];
          const dup = findFileInCurrent(name);
          if (dup) {
            output = `mkdir: cannot create directory '${name}': File exists`;
          } else {
            const newDir: FileNode = {
              id: `file_${Date.now()}`,
              name,
              type: 'directory',
              parentId: folderId,
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            db.files.push(newDir);
            addLog('SUCCESS', 'SYS_MKDIR', 'SUCCESS', `Created dir '${name}' via terminal call.`);
            saveDB(db);
            output = `Directory '${name}' created.`;
          }
        }
        break;

      case 'touch':
        if (args.length === 0) {
          output = 'Usage: touch <filename>';
        } else {
          const name = args[0];
          const dup = findFileInCurrent(name);
          if (dup) {
            output = `touch: ${name} modified timestamp.`;
          } else {
            const newFile: FileNode = {
              id: `file_${Date.now()}`,
              name,
              type: 'file',
              parentId: folderId,
              content: '',
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            db.files.push(newFile);
            addLog('SUCCESS', 'SYS_TOUCH', 'SUCCESS', `Created empty file '${name}' via terminal.`);
            saveDB(db);
            output = `File '${name}' created.`;
          }
        }
        break;

      case 'cat':
        if (args.length === 0) {
          output = 'Usage: cat <filename>';
        } else {
          const name = args[0];
          const targetFile = findFileInCurrent(name);
          if (!targetFile) {
            output = `cat: ${name}: No such file or directory`;
          } else if (targetFile.type !== 'file') {
            output = `cat: ${name}: Is a directory`;
          } else {
            output = targetFile.content || '(File is empty)';
            addLog('INFO', 'SYS_READ', 'SUCCESS', `Read data from file '${name}'.`);
          }
        }
        break;

      case 'rm':
        if (args.length === 0) {
          output = 'Usage: rm <filename>';
        } else {
          const name = args[0];
          const fileToRm = findFileInCurrent(name);
          if (!fileToRm) {
            output = `rm: ${name}: No such file or directory`;
          } else {
            db.files = db.files.filter(f => f.id !== fileToRm.id);
            addLog('WARNING', 'SYS_UNLINK', 'SUCCESS', `Deleted object '${name}' via terminal.`);
            saveDB(db);
            output = `Successfully unlinked '${name}'.`;
          }
        }
        break;

      case 'cp':
        if (args.length < 2) {
          output = 'Usage: cp <source_file> <target_name>';
        } else {
          const src = args[0];
          const dst = args[1];
          const srcF = findFileInCurrent(src);
          if (!srcF) {
            output = `cp: cannot stat '${src}': No such file`;
          } else if (srcF.type !== 'file') {
            output = `cp: target directory structures copying not supported.`;
          } else {
            const newF: FileNode = {
              id: `file_${Date.now()}`,
              name: dst,
              type: 'file',
              parentId: folderId,
              content: srcF.content,
              size: srcF.size,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            db.files.push(newF);
            addLog('SUCCESS', 'SYS_COPY', 'SUCCESS', `Copied '${src}' to '${dst}'.`);
            saveDB(db);
            output = `File '${src}' copied to '${dst}'.`;
          }
        }
        break;

      case 'mv':
        if (args.length < 2) {
          output = 'Usage: mv <source> <target>';
        } else {
          const src = args[0];
          const dst = args[1];
          const fileToMv = findFileInCurrent(src);
          if (!fileToMv) {
            output = `mv: cannot stat '${src}': No such file`;
          } else {
            fileToMv.name = dst;
            fileToMv.updatedAt = new Date().toISOString();
            addLog('INFO', 'SYS_RENAME', 'SUCCESS', `Renamed '${src}' to '${dst}'.`);
            saveDB(db);
            output = `Renamed '${src}' to '${dst}'.`;
          }
        }
        break;

      case 'date':
      case 'time':
        output = `Hardware Real-Time-Clock (RTC):\n${new Date().toLocaleString()}\nHost Kernel: MiniKernel OS Build v1.0.4`;
        break;

      case 'ps':
        const active = db.processes.filter(p => p.state !== 'Terminated');
        output = `PID\tNAME\t\tPRIORITY\tSTATE\t\tRAM\n` + 
          active.map(p => `${p.pid}\t${p.name.padEnd(12)}\t${p.priority}\t\t${p.state.padEnd(10)}\t${p.memorySize}KB`).join('\n');
        break;

      case 'kill':
        if (args.length === 0) {
          output = 'Usage: kill <pid>';
        } else {
          const targetPid = Number(args[0]);
          const proc = db.processes.find(p => p.pid === targetPid);
          if (!proc || proc.state === 'Terminated') {
            output = `kill: PID ${targetPid}: No such process`;
          } else {
            proc.state = 'Terminated';
            // Release memory resources
            db.memoryBlocks = db.memoryBlocks.map(b => b.processId === targetPid ? { ...b, allocated: false, processId: undefined, processName: undefined, internalFragmentation: undefined } : b);
            db.pageEntries = db.pageEntries.map(pe => pe.processId === targetPid ? { ...pe, allocated: false, processId: 0, processName: 'Free' } : pe);
            addLog('WARNING', 'SYS_KILL', 'SUCCESS', `Terminated PID ${targetPid} ('${proc.name}') from shell.`);
            saveDB(db);
            output = `SIGKILL signal sent. Process ${targetPid} terminated.`;
          }
        }
        break;

      case 'mem':
        const allocatedRam = db.memoryBlocks.filter(b => b.allocated).reduce((sum, b) => sum + b.size, 0);
        output = `Virtual Memory Paging Map:\nTotal Capacity: 1024KB\nAllocated: ${allocatedRam}KB\nFree: ${1024 - allocatedRam}KB\nPage Frame translation maps:\n` +
          db.pageEntries.map(pe => `  Frame ${pe.frameId.toString().padStart(2)}: -> Page ${pe.pageId.toString().padStart(2)} [${pe.processName}]`).join('\n');
        break;

      case 'cpu':
        const runningP = db.processes.filter(p => p.state === 'Running').length;
        const load = Math.min(100, Math.max(10, runningP * 33 + Math.floor(Math.random() * 15)));
        output = `Simulated CPU Core Load:\n  Core 0: ${Math.round(load * 0.9)}%\n  Core 1: ${Math.round(load * 1.1)}%\n  Overall Multi-Thread Load: ${load}%`;
        break;

      case 'whoami':
        output = 'admin (Superuser Kernel Context)';
        break;

      case 'echo':
        output = args.join(' ');
        break;

      case 'history':
        output = db.terminalHistory.slice(-15).map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
        break;

      case 'clear':
        output = '__CLEAR_SCREEN__';
        break;

      default:
        output = `bash: command not found: ${cmd}\nType 'help' to see available kernel calls.`;
        break;
    }

    res.json({ output });
  });

  // System Call Simulator Trace Generator
  app.post('/api/systemcalls/simulate', (req, res) => {
    const { syscall } = req.body;
    let steps: SystemCallStep[] = [];

    addLog('INFO', 'SYS_CALL_TRACE', 'INITIATED', `Generating system call execution trace for ${syscall}().`);

    switch (syscall) {
      case 'fork':
        steps = [
          { title: 'User Mode Call', description: 'User application triggers fork() assembly instruction, setting system call register AX to 0x02.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Trap Interrupt (INT 0x80)', description: 'CPU transitions from privilege Ring 3 to Ring 0. Saves instruction pointer (IP) and flags register on Kernel stack.', state: 'Switching to Kernel Mode', activeComponent: 'CPU' },
          { title: 'Task Allocator', description: 'Kernel reads Process Control Table. Allocates a new PID and creates a copy of the parent Process Control Block (PCB).', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'Page Table Duplication', description: 'Memory manager duplicates page tables. Copy-on-Write (COW) flags are enabled for security isolation.', state: 'Kernel Mode', activeComponent: 'RAM' },
          { title: 'Return Values Set', description: 'Kernel writes return register value: child gets 0, parent receives Child PID. Both processes enter READY queue state.', state: 'Returning to User Mode', activeComponent: 'Kernel' }
        ];
        break;

      case 'exec':
        steps = [
          { title: 'User Application Request', description: 'Active shell executes execve("/bin/ls", argv, envp), demanding replacement of user binary stack.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Software Interrupt Trap', description: 'CPU catches system trap, context-switches register tables, and transfers thread control to kernel handler sys_execve().', state: 'Kernel Mode', activeComponent: 'CPU' },
          { title: 'Virtual Memory Flush', description: 'Kernel flushes the caller process virtual address space, breaking current text, data, and stack frame allocations.', state: 'Kernel Mode', activeComponent: 'RAM' },
          { title: 'VFS Binary Mapping', description: 'VFS opens "/bin/ls" executable file node, parses ELF file headers, and loads segment definitions.', state: 'Kernel Mode', activeComponent: 'FS' },
          { title: 'Stack & IP Setup', description: 'Memory maps new text and stack segments. Registers are reset. CPU sets Program Counter (PC) to executable entry address.', state: 'Return to User Mode', activeComponent: 'CPU' }
        ];
        break;

      case 'wait':
        steps = [
          { title: 'Parent Sleep Block', description: 'Parent calls wait(NULL) to synchronize with child termination, entering blocking state.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Scheduler Context Switch', description: 'Kernel marks parent process state as WAITING. Context scheduler executes task-switch to run another process.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'CPU Sleep Executed', description: 'CPU removes parent thread from execution core registers, restoring saved context of next active thread.', state: 'Kernel Mode', activeComponent: 'CPU' },
          { title: 'Child Wakeup Event', description: 'Once child calls exit(), kernel receives signal, wakes parent up, and moves parent from WAITING back to READY queue.', state: 'Kernel Mode', activeComponent: 'Kernel' }
        ];
        break;

      case 'exit':
        steps = [
          { title: 'Process Exit Signal', description: 'User application reaches end of main() or calls exit(0) directly.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Resource Cleanup', description: 'sys_exit() trap frees memory, page tables, closes all open file descriptors, and releases process locks.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'Zombie State Transition', description: 'Kernel changes child process state to ZOMBIE, leaving its return code in the PCB table for parent queries.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'Scheduler Invoked', description: 'Scheduler picks next task from READY queue to occupy CPU cycles.', state: 'Kernel Mode', activeComponent: 'CPU' }
        ];
        break;

      case 'open':
        steps = [
          { title: 'Open Call Parameters', description: 'App calls open("/etc/passwd", O_RDONLY) to obtain virtual file stream handle.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'VFS Index Resolution', description: 'Kernel directory traversal parses path separators, finds inode matching "passwd" in simulated Virtual File System.', state: 'Kernel Mode', activeComponent: 'FS' },
          { title: 'File Descriptor Alloc', description: 'Kernel inserts reference inside process file descriptor table (e.g. FD 3), assigning it O_RDONLY flags.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'FD Return Handle', description: 'CPU returns allocated descriptor integer value 3 to user thread. Success.', state: 'User Mode', activeComponent: 'CPU' }
        ];
        break;

      case 'close':
        steps = [
          { title: 'Close Descriptor Call', description: 'Application calls close(3) to flush virtual buffering structures.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Descriptor Unlink', description: 'Kernel sys_close() parses FD 3. Clears its file table pointer and updates reference counters on inode structures.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'Buffer Write Flush', description: 'Any pending system buffers are synced back to disk cache blocks.', state: 'Kernel Mode', activeComponent: 'FS' },
          { title: 'Return Code Output', description: 'Kernel frees process descriptor index slot 3 and returns integer 0 (Success).', state: 'User Mode', activeComponent: 'CPU' }
        ];
        break;

      case 'read':
        steps = [
          { title: 'Buffer Allocation Call', description: 'App allocates local buffer and executes read(3, buffer, 100) seeking page details.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Privilege Trap & Check', description: 'Kernel intercepts call, verifies process has valid read rights on FD 3 file reference.', state: 'Kernel Mode', activeComponent: 'Kernel' },
          { title: 'Buffer Cache Mapping', description: 'Kernel fetches VFS file content, copy data from kernel buffer memory into user space buffer address.', state: 'Kernel Mode', activeComponent: 'FS' },
          { title: 'Return Bytes Count', description: 'Registers are loaded with count of bytes successfully read. Thread continues running.', state: 'User Mode', activeComponent: 'CPU' }
        ];
        break;

      case 'write':
        steps = [
          { title: 'Write Data Attempt', description: 'App calls write(1, "hello", 5) to print characters onto terminal standard output.', state: 'User Mode', activeComponent: 'User App' },
          { title: 'Security Range Validation', description: 'Kernel checks if writing pointer resides inside the application allocated memory space segments.', state: 'Kernel Mode', activeComponent: 'RAM' },
          { title: 'Device Terminal Transfer', description: 'VFS writes string to FD 1, routing stream into the simulated virtual tty screen buffers.', state: 'Kernel Mode', activeComponent: 'FS' },
          { title: 'Operation Done return', description: 'Kernel returns 5 bytes written count. Control returns to caller.', state: 'User Mode', activeComponent: 'CPU' }
        ];
        break;

      default:
        return res.status(404).json({ error: 'System call simulation sequence unknown.' });
    }

    res.json(steps);
  });

  // Logging API
  app.get('/api/logs', (req, res) => {
    const db = getDB();
    res.json(db.logs);
  });

  app.post('/api/logs/clear', (req, res) => {
    const db = getDB();
    db.logs = [
      { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level: 'INFO', action: 'CLEAR_LOGS', status: 'OK', details: 'System audit log space flushed by administrator.' }
    ];
    saveDB(db);
    res.json({ success: true });
  });

  // --- VITE DEV SERVER / PRODUCTION SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MiniKernel OS Server running on http://localhost:${PORT}`);
  });
}

startServer();

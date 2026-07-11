/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal as TerminalIcon, 
  Cpu, 
  Settings, 
  Wifi, 
  AlertCircle, 
  LogOut,
  Bell,
  Lock,
  UserCheck
} from 'lucide-react';
import { User, Process, LogEntry } from './types';

// Import modular panels
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProcessView from './components/ProcessView';
import SchedulerView from './components/SchedulerView';
import MemoryView from './components/MemoryView';
import FileSystemView from './components/FileSystemView';
import TerminalView from './components/TerminalView';
import SystemCallView from './components/SystemCallView';
import LogsView from './components/LogsView';
import AboutView from './components/AboutView';
import DeviceNetworkView from './components/DeviceNetworkView';
import AdminPanelView from './components/AdminPanelView';

export default function App() {
  // Boot and Auth State
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootText, setBootText] = useState('Initiating hardware bios routines...');
  
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Shell State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Notification Toast State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);

  // Simulation of custom diagnostic loading bars during boot
  useEffect(() => {
    const bootSteps = [
      { prg: 20, txt: 'Probing 1024KB virtual physical SDRAM partition frames...' },
      { prg: 45, txt: 'Mounting Virtual File System (VFS) FAT descriptors...' },
      { prg: 70, txt: 'Spawning PID 1 (systemd) core thread controllers...' },
      { prg: 90, txt: 'Calibrating POSIX 0x80 software interrupt trap tables...' },
      { prg: 100, txt: 'MiniKernel OS Simulator bus channels fully operational.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < bootSteps.length) {
        setBootProgress(bootSteps[currentStep].prg);
        setBootText(bootSteps[currentStep].txt);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsBooting(false);
          // Auto check localStorage sessions
          const savedUser = localStorage.getItem('minikernel_session');
          if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            setAuthenticated(true);
            showToast('Session restored successfully.', 'success');
          }
        }, 600);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Fetch process lists & dashboard stats periodically
  useEffect(() => {
    if (!authenticated) return;

    fetchStats();
    fetchProcesses();
    fetchLogs();

    // Poll system metrics every 4 seconds to simulate active processor load changes
    const statsTimer = setInterval(() => {
      fetchStats();
    }, 4000);

    return () => clearInterval(statsTimer);
  }, [authenticated]);

  // Bind global keyboard shortcuts to instantly switch system workspace views
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'D') { setActiveTab('dashboard'); showToast('Opened Dashboard Panel', 'info'); }
        if (key === 'P') { setActiveTab('processes'); showToast('Opened Processes Panel', 'info'); }
        if (key === 'S') { setActiveTab('scheduler'); showToast('Opened Scheduler Panel', 'info'); }
        if (key === 'M') { setActiveTab('memory'); showToast('Opened Memory Manager', 'info'); }
        if (key === 'F') { setActiveTab('filesystem'); showToast('Opened File System', 'info'); }
        if (key === 'T') { setActiveTab('terminal'); showToast('Opened Shell Terminal', 'info'); }
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setStats(data);
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed contacting dashboard stats bus:', err);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/processes');
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setProcesses(data);
      }
    } catch (e) {
      console.error('Failed fetching processes:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed reading logs:', e);
    }
  };

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Auth logins
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        const userObj: User = { username: data.username, role: data.role };
        setCurrentUser(userObj);
        setAuthenticated(true);
        showToast(`Welcome back, root user '${data.username}'!`, 'success');

        if (rememberMe) {
          localStorage.setItem('minikernel_session', JSON.stringify(userObj));
        }
      } else {
        const errData = await response.json();
        setLoginError(errData.message || 'Authentication failed.');
      }
    } catch (error) {
      setLoginError('Could not link to backend verification services.');
    }
  };

  // Auth logouts
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser?.username })
      });
    } catch (e) {
      console.error(e);
    }

    localStorage.removeItem('minikernel_session');
    setAuthenticated(false);
    setCurrentUser(null);
    showToast('Secure session shutdown completed.', 'warning');
  };

  // --- Process Action dispatchers ---

  const handleCreateProcess = async (procData: any) => {
    try {
      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(procData)
      });

      if (response.ok) {
        showToast(`Process '${procData.name}' spawned and pages allocated!`, 'success');
        fetchProcesses();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.error || 'Out of core RAM.', 'error');
      }
    } catch (e) {
      showToast('Interrupt routing failure spawning process.', 'error');
    }
  };

  const handleKillProcess = async (pid: number) => {
    try {
      const response = await fetch('/api/processes/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });

      if (response.ok) {
        showToast(`SIGKILL sent to PID ${pid}. freed memory pages.`, 'warning');
        fetchProcesses();
        fetchStats();
      }
    } catch (e) {
      showToast('SIGKILL dispatch failure.', 'error');
    }
  };

  const handleSuspendProcess = async (pid: number) => {
    try {
      const response = await fetch('/api/processes/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });

      if (response.ok) {
        showToast(`PID ${pid} suspended to Waiting list.`, 'info');
        fetchProcesses();
      }
    } catch (e) {
      showToast('Suspend execution trap failure.', 'error');
    }
  };

  const handleResumeProcess = async (pid: number) => {
    try {
      const response = await fetch('/api/processes/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });

      if (response.ok) {
        showToast(`PID ${pid} restored to Ready list.`, 'success');
        fetchProcesses();
      }
    } catch (e) {
      showToast('Resume thread execution trap failure.', 'error');
    }
  };

  const handleChangePriority = async (pid: number, priority: number) => {
    try {
      const response = await fetch('/api/processes/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, priority })
      });

      if (response.ok) {
        showToast(`Nice value changed on PID ${pid} to ${priority}.`, 'success');
        fetchProcesses();
      }
    } catch (e) {
      showToast('Nice adjustment failure.', 'error');
    }
  };

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs/clear', { method: 'POST' });
      if (response.ok) {
        showToast('System logs flushed.', 'warning');
        fetchLogs();
      }
    } catch (e) {
      showToast('Clear logs failed.', 'error');
    }
  };

  // Render the currently active sub-panel
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} onRefresh={fetchStats} />;
      case 'processes':
        return (
          <ProcessView
            processes={processes}
            onCreateProcess={handleCreateProcess}
            onKillProcess={handleKillProcess}
            onSuspendProcess={handleSuspendProcess}
            onResumeProcess={handleResumeProcess}
            onChangePriority={handleChangePriority}
          />
        );
      case 'scheduler':
        return <SchedulerView />;
      case 'memory':
        return <MemoryView />;
      case 'filesystem':
        return <FileSystemView />;
      case 'terminal':
        return <TerminalView />;
      case 'devicenetwork':
        return <DeviceNetworkView showToast={showToast} />;
      case 'systemcalls':
        return <SystemCallView />;
      case 'admin':
        return <AdminPanelView showToast={showToast} />;
      case 'logs':
        return <LogsView logs={logs} onClearLogs={handleClearLogs} onRefreshLogs={fetchLogs} />;
      case 'about':
        return <AboutView />;
      default:
        return <DashboardView stats={stats} onRefresh={fetchStats} />;
    }
  };

  // --- BOOT DIAGNOSTIC SCREEN ---
  if (isBooting) {
    return (
      <div id="boot-screen" className="fixed inset-0 bg-cyber-bg flex flex-col justify-center items-center p-6 text-slate-100 font-mono select-none">
        <div className="w-full max-w-md space-y-6 flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 animate-pulse flex items-center justify-center text-white font-display font-bold text-3xl shadow-xl shadow-violet-500/20">
              K
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="text-center">
            <h1 className="font-display font-bold text-lg text-slate-200">MiniKernel Operating System</h1>
            <p className="text-[10px] text-violet-400 font-mono tracking-wider mt-0.5">BOOT DIAGNOSTIC LOAD SEQUENCE</p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-2">
            <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-300" 
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{bootProgress}% Loaded</span>
              <span className="text-emerald-400 uppercase font-bold tracking-wider">SECURE_BOOT_ON</span>
            </div>
          </div>

          {/* Log terminal printouts */}
          <div className="w-full h-16 bg-slate-950 border border-slate-900 rounded-xl p-3 text-[10px] text-slate-400 leading-normal overflow-hidden relative">
            <div className="absolute top-1 right-2 text-violet-500/40 text-[9px]">UART_BUS_TTY1</div>
            <span className="text-emerald-500 mr-1.5">&gt;</span>
            <span className="text-slate-300">{bootText}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- LOCK SCREEN / LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div id="login-screen" className="fixed inset-0 bg-cyber-bg flex items-center justify-center p-4 text-slate-100 select-none">
        
        {/* Background visual graphics */}
        <div className="absolute top-12 left-12 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-12 right-12 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />

        <div className="w-full max-w-sm glassmorphism rounded-3xl p-6 relative overflow-hidden flex flex-col space-y-6 glow-purple border-violet-500/25">
          
          {/* Lock header */}
          <div className="text-center flex flex-col items-center space-y-2">
            <div className="p-3 bg-violet-600/15 border border-violet-500/35 text-violet-400 rounded-full shadow-lg shadow-violet-500/5 animate-pulse">
              <Lock size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white">System Security Access</h1>
              <p className="text-xs text-slate-500 font-mono tracking-wide mt-0.5">Dual-Privilege Monitor Ring 3 Login</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2 items-center leading-relaxed">
                <AlertCircle size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Secure Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 font-mono transition-all"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Terminal Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 font-mono transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 py-1 font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 focus:ring-0 accent-violet-500 cursor-pointer"
                />
                <span>Remember session</span>
              </label>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-mono font-bold text-xs tracking-wider text-white shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 transition-all border border-violet-400/20"
            >
              AUTHENTICATE STREAM
            </button>
          </form>

          {/* Quick accounts autofill cards */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Diagnostic Access Portals:</span>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <button
                id="autofill-admin-btn"
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-center hover:text-white transition-all text-[9px] font-bold"
              >
                AUTO-FILL ADMIN
              </button>
              <button
                id="autofill-student-btn"
                onClick={() => { setUsername('student'); setPassword('os_project'); }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-center hover:text-white transition-all text-[9px] font-bold"
              >
                AUTO-FILL STUDENT
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- CORE SYSTEM DASHBOARD ENVIRONMENT ---
  return (
    <div id="os-dashboard-root" className="fixed inset-0 bg-cyber-bg flex overflow-hidden text-slate-300 font-sans">
      
      {/* Sidebar Command Plane */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
        cpuUsage={stats ? stats.cpuUsage : 15}
        ramUsagePercent={stats ? stats.ramUsage.percentage : 30}
      />

      {/* Main Panel Viewport wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* Top Header Navbar */}
        <header id="top-navbar" className="h-14 glassmorphism border-b border-slate-900 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-slate-400">MONITOR_CHANNEL_01: ONLINE</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Quick indicators */}
            <div className="hidden sm:flex items-center gap-3 text-slate-500 border-r border-slate-900 pr-4">
              <span className="flex items-center gap-1.5"><Wifi size={12} className="text-emerald-400" /><span>Secure BUS Link</span></span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-violet-400" /><span>Intel Ring-0</span></span>
            </div>

            {/* Current Active Workspace Descriptor */}
            <div className="font-sans font-medium text-slate-400 text-[11px]">
              Workspace: <strong className="text-slate-100 font-mono capitalize">{activeTab}</strong>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel Body */}
        <main className="flex-1 overflow-hidden relative">
          {renderActivePanel()}
        </main>
        
      </div>

      {/* TOAST NOTIFICATION STACK */}
      <div id="toast-notifications-container" className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 glow-blue',
            info: 'bg-blue-950/70 border-blue-500/40 text-blue-300 glow-blue',
            warning: 'bg-amber-950/70 border-amber-500/40 text-amber-300 glow-blue',
            error: 'bg-red-950/70 border-red-500/40 text-red-300 glow-blue'
          };
          return (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-xl backdrop-blur-md animate-fade-in text-xs font-sans border-l-4 ${typeStyles[t.type]}`}
            >
              <Bell size={14} className="shrink-0 mt-0.5 animate-bounce" />
              <div>{t.message}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

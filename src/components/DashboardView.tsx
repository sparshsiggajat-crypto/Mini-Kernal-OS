/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  Code2, 
  ClipboardList, 
  Play, 
  Activity, 
  AlertCircle 
} from 'lucide-react';
import { LogEntry } from '../types';

interface DashboardProps {
  stats: {
    cpuUsage: number;
    ramUsage: {
      total: number;
      allocated: number;
      percentage: number;
    };
    runningProcesses: number;
    totalProcesses: number;
    totalFiles: number;
    systemCallsCount: number;
    logs: LogEntry[];
  } | null;
  onRefresh: () => void;
}

export default function DashboardView({ stats, onRefresh }: DashboardProps) {
  const [time, setTime] = useState(new Date());
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(15).fill(25));
  const [ramHistory, setRamHistory] = useState<number[]>(Array(15).fill(45));

  // Running digital system clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate smooth chart animation by adding current stat to histories
  useEffect(() => {
    if (stats) {
      setCpuHistory(prev => [...prev.slice(1), stats.cpuUsage]);
      setRamHistory(prev => [...prev.slice(1), stats.ramUsage.percentage]);
    }
  }, [stats]);

  if (!stats) {
    return (
      <div id="dashboard-loading" className="flex items-center justify-center h-full text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-wider">CONNECTING TO KERNEL BUS...</p>
        </div>
      </div>
    );
  }

  // Generate SVG path for metrics history lines
  const generateSvgPath = (data: number[]) => {
    const width = 240;
    const height = 60;
    const padding = 5;
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * (width - 10) + padding;
      const y = height - (val / 100) * (height - 10) - padding;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div id="dashboard-view-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100">
      
      {/* Top Banner with Clock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 glassmorphism rounded-2xl border-l-4 border-l-violet-500 glow-blue">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">System Monitor Overview</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Control plane interface for physical scheduling blocks and virtual paging file allocations.</p>
        </div>
        <div className="text-right flex items-center gap-4">
          <div className="text-left font-mono">
            <div className="text-xs text-violet-400 uppercase tracking-widest font-bold">KERNEL TIME (EST)</div>
            <div className="text-xl font-bold font-display text-white mt-0.5">
              {time.toLocaleTimeString()}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{time.toLocaleDateString()}</div>
          </div>
          <button 
            id="force-refresh-btn"
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-400 transition-all text-xs font-mono font-bold text-violet-300"
          >
            PING BUS
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CPU Card */}
        <div className="p-5 glassmorphism rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">CPU UTILIZATION</span>
              <div className="text-2xl font-display font-bold text-white mt-1">{stats.cpuUsage}%</div>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-all">
              <Cpu size={20} />
            </div>
          </div>
          {/* Animated CPU Sparkline */}
          <div className="h-10 mt-4 flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60">
              <path
                d={generateSvgPath(cpuHistory)}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Fill under the path */}
              <path
                d={`${generateSvgPath(cpuHistory)} L 235,60 L 5,60 Z`}
                fill="url(#cpuGrad)"
                opacity="0.15"
              />
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 flex justify-between">
            <span>2-CORE PROCESSOR</span>
            <span className="text-violet-400">STATUS: LIVE</span>
          </div>
        </div>

        {/* RAM Card */}
        <div className="p-5 glassmorphism rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">MEMORY ALLOC</span>
              <div className="text-2xl font-display font-bold text-white mt-1">
                {stats.ramUsage.allocated} <span className="text-xs text-slate-500">/ {stats.ramUsage.total}KB</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all">
              <Layers size={20} />
            </div>
          </div>
          {/* RAM Progress slider bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>PHYSICAL PAGING</span>
              <span className="text-blue-400">{stats.ramUsage.percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" 
                style={{ width: `${stats.ramUsage.percentage}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2.5 flex justify-between">
            <span>PAGE FRAME SIZE: 32KB</span>
            <span className="text-blue-400">16 FRAMES</span>
          </div>
        </div>

        {/* Processes Card */}
        <div className="p-5 glassmorphism rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">PROCESS TABLE</span>
              <div className="text-2xl font-display font-bold text-white mt-1">
                {stats.runningProcesses} <span className="text-xs text-slate-500">RUNNING ({stats.totalProcesses} TOTAL)</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-all">
              <Activity size={20} />
            </div>
          </div>
          {/* Visual process indicators */}
          <div className="flex gap-1.5 mt-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                  i < stats.runningProcesses 
                    ? 'bg-emerald-500 animate-pulse' 
                    : i < stats.totalProcesses 
                    ? 'bg-emerald-500/30' 
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-3 flex justify-between">
            <span>MUTEX CHANNELS: 8</span>
            <span className="text-emerald-400">STABLE</span>
          </div>
        </div>

        {/* Files Card */}
        <div className="p-5 glassmorphism rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">FILESYSTEM INODES</span>
              <div className="text-2xl font-display font-bold text-white mt-1">
                {stats.totalFiles} <span className="text-xs text-slate-500">MOUNTED</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-all">
              <HardDrive size={20} />
            </div>
          </div>
          <div className="mt-5 bg-cyan-505/5 border border-cyan-500/10 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
            <div className="font-mono text-[10px] text-cyan-300 truncate">VFS ROOT MOUNTED AS /dev/sda1</div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 flex justify-between">
            <span>FS TYPE: VIRTUAL FAT</span>
            <span className="text-cyan-400">SECURE</span>
          </div>
        </div>

      </div>

      {/* Main Core Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity & System Health Panel */}
        <div className="lg:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="text-violet-400" size={18} />
              <h3 className="font-display font-bold text-base text-white">System Interrupt & API Stats</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">TOTAL API CALLS: <span className="text-violet-400 font-bold">{stats.systemCallsCount}</span></span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System calls distribution info panel */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide">Privilege Intercept Actions</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-0.5">
                    <span>File I/O (open, read, write)</span>
                    <span className="text-cyan-400 font-bold">54%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: '54%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-0.5">
                    <span>Task Spawning (fork, exec)</span>
                    <span className="text-violet-400 font-bold">28%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400" style={{ width: '28%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-0.5">
                    <span>Synchronization (wait, exit)</span>
                    <span className="text-amber-400 font-bold">18%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: '18%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Kernel environment spec card */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide mb-2">MicroKernel Architecture Specs</div>
              <table className="w-full text-[11px] font-mono text-slate-400">
                <tbody>
                  <tr className="border-b border-slate-800/40"><td className="py-1">System Mode</td><td className="text-right text-emerald-400 font-bold">MONITOR_SUPER</td></tr>
                  <tr className="border-b border-slate-800/40"><td className="py-1">Scheduler Mode</td><td className="text-right text-slate-200">DYNAMIC_TIME_SLICE</td></tr>
                  <tr className="border-b border-slate-800/40"><td className="py-1">Memory Protection</td><td className="text-right text-slate-200">BASE_LIMIT_REGISTERS</td></tr>
                  <tr><td className="py-1">VFS Driver</td><td className="text-right text-slate-200">IN_MEMORY_INODE</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-950/10 border border-violet-500/20 flex gap-3.5 items-start">
            <div className="p-1.5 bg-violet-500/20 text-violet-400 rounded-lg shrink-0 mt-0.5">
              <Play size={14} className="fill-current animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-slate-200">College OS Course Assignment Sandbox</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                This MiniKernel represents a complete, dual-privilege CPU/RAM/VFS sandbox. You can add CPU process nodes in the 'Processes' panel, run full Gantt calculations in the 'CPU Scheduler', map page allocations in 'Memory Manager', explore absolute file streams, and trace assembly software interrupt traps.
              </p>
            </div>
          </div>
        </div>

        {/* Live Audit Log Stream */}
        <div className="glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-[320px] lg:h-auto">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3 shrink-0">
            <ClipboardList className="text-blue-400" size={18} />
            <h3 className="font-display font-bold text-base text-white">Live Audit Feed</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {stats.logs.map((log) => {
              const levelColors = {
                SUCCESS: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                INFO: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
                WARNING: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
                ERROR: 'text-red-400 border-red-500/20 bg-red-500/5',
              };

              return (
                <div 
                  key={log.id} 
                  className={`p-2.5 rounded-lg border text-[11px] font-mono leading-normal transition-all hover:bg-slate-850 ${levelColors[log.level]}`}
                >
                  <div className="flex justify-between font-bold text-[9px] opacity-75 mb-1">
                    <span>{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-200 font-sans leading-tight">{log.details}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

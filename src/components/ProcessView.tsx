/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Pause, 
  Play, 
  SlidersHorizontal, 
  Search, 
  Layers, 
  Clock, 
  FileCode,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Database,
  Cpu
} from 'lucide-react';
import { Process, ProcessState } from '../types';

interface ProcessViewProps {
  processes: Process[];
  onCreateProcess: (procData: { name: string; priority: number; burstTime: number; memorySize: number }) => void;
  onKillProcess: (pid: number) => void;
  onSuspendProcess: (pid: number) => void;
  onResumeProcess: (pid: number) => void;
  onChangePriority: (pid: number, priority: number) => void;
}

export default function ProcessView({
  processes,
  onCreateProcess,
  onKillProcess,
  onSuspendProcess,
  onResumeProcess,
  onChangePriority
}: ProcessViewProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(3);
  const [burstTime, setBurstTime] = useState(20);
  const [memorySize, setMemorySize] = useState(32);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [newPriorityValue, setNewPriorityValue] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState('');

  // Advanced Table Sorting states
  const [sortKey, setSortKey] = useState<'pid' | 'name' | 'priority' | 'burstTime' | 'memorySize'>('pid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // PCB Inspector modal state
  const [inspectProc, setInspectProc] = useState<Process | null>(null);

  const activeProcesses = processes.filter(p => p.state !== 'Terminated');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Process name is required.');
      return;
    }
    // Simple sanitization
    const procName = name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 15);
    if (!procName) {
      setErrorMsg('Process name must be alphanumeric.');
      return;
    }

    if (burstTime < 2 || burstTime > 200) {
      setErrorMsg('Burst Time must be between 2 and 200 ms.');
      return;
    }

    if (memorySize < 4 || memorySize > 512) {
      setErrorMsg('Memory Size must be between 4 and 512 KB.');
      return;
    }

    onCreateProcess({
      name: procName,
      priority: Number(priority),
      burstTime: Number(burstTime),
      memorySize: Number(memorySize)
    });

    // Reset form
    setName('');
    setPriority(3);
    setBurstTime(20);
    setMemorySize(32);
  };

  const handlePriorityChangeSubmit = (pid: number) => {
    onChangePriority(pid, newPriorityValue);
    setSelectedPid(null);
  };

  // Sorting Handler
  const requestSort = (key: 'pid' | 'name' | 'priority' | 'burstTime' | 'memorySize') => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortKey === key && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortKey(key);
    setSortOrder(order);
    setCurrentPage(1); // Reset page on sort trigger
  };

  // Filter processes
  const filteredProcesses = activeProcesses.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.pid.toString() === search;
    const matchesState = stateFilter === 'All' ? true : p.state === stateFilter;
    return matchesSearch && matchesState;
  });

  // Sort filtered list
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    let valA: any = a[sortKey];
    let valB: any = b[sortKey];

    // Case-insensitive comparisons for string values
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated list
  const totalItems = sortedProcesses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProcesses = sortedProcesses.slice(startIndex, startIndex + itemsPerPage);

  const stateColors: Record<ProcessState, string> = {
    New: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    Ready: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    Running: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40 animate-pulse',
    Waiting: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    Terminated: 'text-slate-500 bg-slate-900 border-slate-800',
  };

  const getSortIndicator = (key: typeof sortKey) => {
    if (sortKey !== key) return '↕';
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  return (
    <div id="processes-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100 relative">
      
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-white">Process Control Panel</h2>
        <p className="text-sm text-slate-400 font-sans mt-0.5">Inject task threads into the virtual CPU queue, filter by process status, and inspect PCB maps dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Process Creation Form */}
        <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="text-violet-400" size={18} />
            <h3 className="font-display font-bold text-base text-white">Spawn Process Node</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/35 border border-red-900/50 text-red-400 text-xs flex gap-2 items-center">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Process Name</label>
              <input
                id="proc-name-input"
                type="text"
                placeholder="e.g. node_server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Priority (1-10)</label>
                <input
                  id="proc-priority-input"
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Burst Time (ms)</label>
                <input
                  id="proc-burst-input"
                  type="number"
                  min={2}
                  max={200}
                  value={burstTime}
                  onChange={(e) => setBurstTime(Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Memory Demands (KB)</label>
              <div className="space-y-2">
                <input
                  id="proc-memory-input"
                  type="range"
                  min={4}
                  max={256}
                  step={4}
                  value={memorySize}
                  onChange={(e) => setMemorySize(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
                />
                <div className="flex justify-between text-xs font-mono text-slate-500">
                  <span>4KB</span>
                  <span className="text-violet-400 font-bold">{memorySize} KB</span>
                  <span>256KB</span>
                </div>
              </div>
            </div>

            <button
              id="spawn-proc-submit-btn"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-mono font-bold text-xs tracking-wider text-white shadow-md shadow-violet-600/10 hover:shadow-violet-500/20 transition-all border border-violet-400/20"
            >
              CREATE TASK PCB
            </button>
          </form>

          <div className="border-t border-slate-800/60 pt-4 mt-2 space-y-2 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>ACTIVE ALLOCATIONS</span>
              <span className="text-emerald-400 font-bold">{activeProcesses.length} / 10 MAX</span>
            </div>
            <div className="flex justify-between">
              <span>RAM MAP SPACE</span>
              <span className="text-blue-400 font-bold">
                {activeProcesses.reduce((sum, p) => sum + p.memorySize, 0)} KB Allocated
              </span>
            </div>
          </div>
        </div>

        {/* Process Table Grid */}
        <div className="lg:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col min-h-[500px] justify-between">
          
          <div className="space-y-4">
            {/* Table Controls (Search/Filter) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="relative w-full sm:w-64 font-sans">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  id="proc-search-input"
                  type="text"
                  placeholder="Search PID or process..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 font-mono transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto justify-end">
                <SlidersHorizontal size={14} className="text-slate-500" />
                <span className="text-slate-400">STATE:</span>
                <select
                  id="proc-state-filter"
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Active</option>
                  <option value="Ready">Ready</option>
                  <option value="Running">Running</option>
                  <option value="Waiting">Waiting</option>
                </select>
              </div>
            </div>

            {/* Active Process List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] select-none">
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => requestSort('pid')}>
                      PID <span className="text-[8px] opacity-70 ml-0.5">{getSortIndicator('pid')}</span>
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => requestSort('name')}>
                      Process Name <span className="text-[8px] opacity-70 ml-0.5">{getSortIndicator('name')}</span>
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => requestSort('priority')}>
                      Priority <span className="text-[8px] opacity-70 ml-0.5">{getSortIndicator('priority')}</span>
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => requestSort('burstTime')}>
                      Burst (ms) <span className="text-[8px] opacity-70 ml-0.5">{getSortIndicator('burstTime')}</span>
                    </th>
                    <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => requestSort('memorySize')}>
                      Memory <span className="text-[8px] opacity-70 ml-0.5">{getSortIndicator('memorySize')}</span>
                    </th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3 text-right">Interrupt actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {paginatedProcesses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 italic">
                        No active simulated processes match filter constraints.
                      </td>
                    </tr>
                  ) : (
                    paginatedProcesses.map((p) => (
                      <tr key={p.pid} className="hover:bg-slate-900/30 group">
                        <td className="py-3 px-3 text-violet-400 font-bold">{p.pid}</td>
                        <td className="py-3 px-3 font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            <FileCode size={14} className="text-slate-500" />
                            <button 
                              onClick={() => setInspectProc(p)}
                              className="hover:underline hover:text-violet-400 text-left cursor-pointer"
                              title="Inspect PCB structure"
                            >
                              {p.name}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {selectedPid === p.pid ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={newPriorityValue}
                                onChange={(e) => setNewPriorityValue(Number(e.target.value))}
                                className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                              />
                              <button
                                id={`save-priority-btn-${p.pid}`}
                                onClick={() => handlePriorityChangeSubmit(p.pid)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                              >
                                SET
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{p.priority}</span>
                              <button
                                id={`edit-priority-btn-${p.pid}`}
                                onClick={() => {
                                  setSelectedPid(p.pid);
                                  setNewPriorityValue(p.priority);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-violet-400 hover:text-violet-300 hover:underline transition-all"
                              >
                                NICE
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-600" />
                            <span>{p.burstTime}ms</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Layers size={12} className="text-slate-600" />
                            <span>{p.memorySize}KB</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stateColors[p.state]}`}>
                            {p.state}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectProc(p)}
                              title="Inspect PCB Struct"
                              className="p-1.5 rounded-lg bg-violet-950/25 hover:bg-violet-900/35 text-violet-400 border border-violet-900/30 transition-all"
                            >
                              <Info size={12} />
                            </button>
                            {p.state === 'Waiting' ? (
                              <button
                                id={`resume-proc-${p.pid}`}
                                onClick={() => onResumeProcess(p.pid)}
                                title="Resume execution thread"
                                className="p-1.5 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/35 text-emerald-400 border border-emerald-900/30 hover:border-emerald-500/30 transition-all"
                              >
                                <Play size={12} />
                              </button>
                            ) : (
                              <button
                                id={`suspend-proc-${p.pid}`}
                                onClick={() => onSuspendProcess(p.pid)}
                                title="Block process (Wait state)"
                                className="p-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-900/35 text-amber-400 border border-amber-900/30 hover:border-amber-500/30 transition-all"
                              >
                                <Pause size={12} />
                              </button>
                            )}
                            <button
                              id={`kill-proc-${p.pid}`}
                              onClick={() => onKillProcess(p.pid)}
                              title="SIGKILL Process"
                              className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/35 text-red-400 border border-red-900/30 hover:border-red-500/30 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer with Pagination */}
          <div className="flex justify-between items-center border-t border-slate-800/60 pt-4 mt-4 text-[11px] font-mono text-slate-500 shrink-0">
            <span>
              Showing {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} Processes
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1 rounded bg-slate-950 border border-slate-850 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="py-0.5 px-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                PAGE {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1 rounded bg-slate-950 border border-slate-850 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* PCB Inspector Modal */}
      {inspectProc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glassmorphism w-full max-w-lg border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-fade-in text-slate-100 font-sans">
            
            {/* Close button */}
            <button 
              onClick={() => setInspectProc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5 mb-5">
              <div className="p-2 bg-violet-600/10 text-violet-400 rounded-xl border border-violet-500/25">
                <FileCode size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Process Control Block (PCB #{inspectProc.pid})</h3>
                <span className="text-xs text-slate-400">Memory bounds registers & register descriptor logs</span>
              </div>
            </div>

            {/* PCB Fields */}
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 border border-slate-850/60 p-3 rounded-xl">
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1">Process Name</span>
                  <span className="text-sm font-bold text-white">{inspectProc.name}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-3 rounded-xl">
                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1">Process State</span>
                  <span className="text-sm font-bold text-emerald-400">{inspectProc.state}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/50 border border-slate-850/60 p-2.5 rounded-xl text-center">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Priority (Nice)</span>
                  <span className="text-xs font-bold text-slate-200">{inspectProc.priority}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-2.5 rounded-xl text-center">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Remaining CPU</span>
                  <span className="text-xs font-bold text-slate-200">{inspectProc.remainingTime ?? inspectProc.burstTime} ms</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-850/60 p-2.5 rounded-xl text-center">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Memory Usage</span>
                  <span className="text-xs font-bold text-slate-200">{inspectProc.memorySize} KB</span>
                </div>
              </div>

              {/* Hardware Register States */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 block">CPU CPU CORE REGISTERS</span>
                
                <div className="grid grid-cols-2 gap-y-2.5 text-[11px]">
                  <div className="flex justify-between pr-4">
                    <span className="text-slate-500">Program Counter:</span>
                    <span className="text-rose-400 font-bold">0x0040A{inspectProc.pid}F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stack Pointer:</span>
                    <span className="text-rose-400 font-bold">0x7FFF0{inspectProc.pid}D</span>
                  </div>
                  <div className="flex justify-between pr-4">
                    <span className="text-slate-500">Accumulator (AC):</span>
                    <span className="text-slate-300">0x0000000{inspectProc.pid * 7}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Reg (DR):</span>
                    <span className="text-slate-300">0x000FF0D{inspectProc.pid}</span>
                  </div>
                </div>
              </div>

              {/* Memory Bounds Registers */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 block flex items-center gap-1">
                  <Database size={12} className="text-blue-400" />
                  <span>HARDWARE RELOCATION & LIMIT REGISTERS</span>
                </span>
                
                <div className="grid grid-cols-2 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">BASE REGISTER</span>
                    <span className="text-blue-400 font-bold text-xs">0x{(inspectProc.pid * 128).toString(16).toUpperCase()}00 ({inspectProc.pid * 128} KB)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">LIMIT REGISTER</span>
                    <span className="text-amber-400 font-bold text-xs">0x{(inspectProc.memorySize).toString(16).toUpperCase()}00 ({inspectProc.memorySize} KB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end mt-6 pt-3.5 border-t border-slate-800">
              <button
                onClick={() => setInspectProc(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 font-mono text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                DISMISS INSPECT
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

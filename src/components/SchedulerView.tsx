/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Cpu, 
  Plus, 
  Trash2, 
  Info, 
  Sliders, 
  HelpCircle 
} from 'lucide-react';
import { GanttChartStep, SchedulerResults } from '../types';

interface SchedulerProcess {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

const DEFAULT_SCHED_PROCESSES: SchedulerProcess[] = [
  { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 6, priority: 3 },
  { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
  { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 3, priority: 2 }
];

export default function SchedulerView() {
  const [schedProcs, setSchedProcs] = useState<SchedulerProcess[]>(DEFAULT_SCHED_PROCESSES);
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'SJF' | 'Priority' | 'RoundRobin' | 'MultilevelQueue'>('FCFS');
  const [quantum, setQuantum] = useState(2);
  const [results, setResults] = useState<SchedulerResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [playbackStep, setPlaybackStep] = useState<number | null>(null);

  // Form states for adding processes
  const [newName, setNewName] = useState('');
  const [newArrival, setNewArrival] = useState(0);
  const [newBurst, setNewBurst] = useState(5);
  const [newPriority, setNewPriority] = useState(1);
  const [formError, setFormError] = useState('');

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('Name is required.');
      return;
    }

    const cleanName = newName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    if (schedProcs.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      setFormError(`Process '${cleanName}' already exists in list.`);
      return;
    }

    const newProc: SchedulerProcess = {
      id: `S_${Date.now()}`,
      name: cleanName,
      arrivalTime: Number(newArrival),
      burstTime: Number(newBurst),
      priority: Number(newPriority)
    };

    setSchedProcs([...schedProcs, newProc]);
    setNewName('');
    setNewArrival(0);
    setNewBurst(5);
    setNewPriority(1);
  };

  const handleDeleteProcess = (id: string) => {
    setSchedProcs(schedProcs.filter(p => p.id !== id));
    setResults(null);
    setPlaybackStep(null);
  };

  const handleResetSandbox = () => {
    setSchedProcs(DEFAULT_SCHED_PROCESSES);
    setResults(null);
    setPlaybackStep(null);
  };

  const handleSimulate = async () => {
    if (schedProcs.length === 0) return;
    setIsSimulating(true);
    setPlaybackStep(null);

    try {
      const response = await fetch('/api/scheduler/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processes: schedProcs,
          algorithm,
          timeQuantum: quantum
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        // Trigger step-by-step Gantt animation playback
        let step = 0;
        const interval = setInterval(() => {
          setPlaybackStep(step);
          step++;
          if (step >= data.ganttChart.length) {
            clearInterval(interval);
          }
        }, 800);
      }
    } catch (error) {
      console.error('Failed to contact CPU simulation bus:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Render Gantt Chart blocks
  const renderGanttChart = () => {
    if (!results || !results.ganttChart || results.ganttChart.length === 0) return null;
    
    const chart = results.ganttChart;
    const totalRuntime = chart[chart.length - 1].end;

    // Pick dynamic background colors for process labels
    const getProcColor = (name: string) => {
      const colors = [
        'bg-violet-600/30 border-violet-500 text-violet-300 shadow-violet-500/10',
        'bg-blue-600/30 border-blue-500 text-blue-300 shadow-blue-500/10',
        'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-emerald-500/10',
        'bg-amber-600/30 border-amber-500 text-amber-300 shadow-amber-500/10',
        'bg-rose-600/30 border-rose-500 text-rose-300 shadow-rose-500/10',
        'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-cyan-500/10'
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="font-display font-bold text-sm text-slate-200">Gantt Chart Execution Timeline</h4>
          <span className="font-mono text-[10px] text-slate-500">TOTAL RUNTIME: {totalRuntime} ms</span>
        </div>

        {/* Row of blocks */}
        <div className="w-full h-14 bg-slate-950 rounded-xl border border-slate-900 overflow-hidden flex relative">
          {chart.map((step, index) => {
            const stepDuration = step.end - step.start;
            const widthPct = (stepDuration / totalRuntime) * 100;
            const isHighlighted = playbackStep !== null && index <= playbackStep;

            return (
              <div
                key={index}
                style={{ width: `${widthPct}%` }}
                className={`h-full border-r border-slate-950 flex flex-col justify-center items-center font-mono text-[11px] transition-all duration-500 ${
                  isHighlighted 
                    ? getProcColor(step.processName) + ' border-t-2' 
                    : 'bg-slate-900/10 border-slate-800 text-slate-600 border-dashed border-r'
                }`}
              >
                <span className="font-bold">{step.processName}</span>
                <span className="text-[9px] opacity-75">{stepDuration}ms</span>
              </div>
            );
          })}
        </div>

        {/* Time notches underneath the chart */}
        <div className="w-full flex relative h-5 font-mono text-[9px] text-slate-500">
          <div className="absolute left-0">0</div>
          {chart.map((step, index) => {
            const widthPct = (step.end / totalRuntime) * 100;
            const isVisible = playbackStep === null || index <= playbackStep;
            return (
              <div
                key={index}
                style={{ left: `${widthPct}%` }}
                className={`absolute -translate-x-1/2 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                {step.end}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="scheduler-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-white">CPU Process Scheduler</h2>
        <p className="text-sm text-slate-400 font-sans mt-0.5">Solve and verify classic Operating System scheduling algorithms. Animate threads on the execution timeline.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Sandbox Settings & Alg choices */}
        <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="text-violet-400" size={18} />
              <h3 className="font-display font-bold text-base text-white">Simulation Core</h3>
            </div>
            <button 
              id="reset-sandbox-btn"
              onClick={handleResetSandbox}
              title="Reset sandbox to typical problem set"
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition-all hover:bg-slate-800"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Scheduling Algorithm</label>
              <select
                id="sched-algo-select"
                value={algorithm}
                onChange={(e) => {
                  setAlgorithm(e.target.value as any);
                  setResults(null);
                  setPlaybackStep(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-sans"
              >
                <option value="FCFS">First-Come, First-Served (FCFS)</option>
                <option value="SJF">Shortest Job First (SJF) Non-Preemptive</option>
                <option value="Priority">Priority Scheduling Non-Preemptive</option>
                <option value="RoundRobin">Round Robin (RR)</option>
                <option value="MultilevelQueue">Multilevel Preemptive Queue (MLQ)</option>
              </select>
            </div>

            {(algorithm === 'RoundRobin' || algorithm === 'MultilevelQueue') && (
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Time Quantum (ms)</label>
                <input
                  id="sched-quantum-input"
                  type="number"
                  min={1}
                  max={20}
                  value={quantum}
                  onChange={(e) => {
                    setQuantum(Number(e.target.value));
                    setResults(null);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>
            )}

            <button
              id="sched-simulate-btn"
              disabled={schedProcs.length === 0 || isSimulating}
              onClick={handleSimulate}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-850 disabled:text-slate-600 disabled:border-slate-900 font-mono font-bold text-xs tracking-wider text-white shadow-md transition-all border border-violet-400/20 flex justify-center items-center gap-2"
            >
              <Cpu size={14} className={isSimulating ? 'animate-spin' : ''} />
              <span>{isSimulating ? 'RUNNING SCHEDULER...' : 'CALCULATE TIMELINE'}</span>
            </button>
          </div>

          <div className="border-t border-slate-800/60 pt-4 mt-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Plus size={14} /> Add Simulated Process
            </h4>

            <form onSubmit={handleAddProcess} className="space-y-3 font-sans">
              {formError && (
                <div className="p-2 rounded bg-red-950/20 border border-red-900/40 text-[10px] text-red-400 font-mono">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    id="sched-new-name"
                    type="text"
                    placeholder="Name (e.g. P5)"
                    maxLength={5}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                  />
                </div>
                <div>
                  <input
                    id="sched-new-arrival"
                    type="number"
                    min={0}
                    placeholder="Arrival (ms)"
                    value={newArrival}
                    onChange={(e) => setNewArrival(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    id="sched-new-burst"
                    type="number"
                    min={1}
                    placeholder="Burst (ms)"
                    value={newBurst}
                    onChange={(e) => setNewBurst(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                  />
                </div>
                <div>
                  <input
                    id="sched-new-priority"
                    type="number"
                    min={1}
                    placeholder="Priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                  />
                </div>
              </div>
              <button
                id="sched-add-proc-btn"
                type="submit"
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-[11px] font-mono border border-slate-800 hover:border-slate-700 transition-all text-slate-300"
              >
                PUSH TO SANDBOX
              </button>
            </form>
          </div>
        </div>

        {/* Task lists & Gantt Chart calculation output */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Input Sandbox Table */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 mb-4">
              Active Simulator Sandbox Queue
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="py-2 px-3">Process</th>
                    <th className="py-2 px-3">Arrival (ms)</th>
                    <th className="py-2 px-3">Burst (ms)</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {schedProcs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-600 italic">
                        No processes in simulator queue. Add a process or reset.
                      </td>
                    </tr>
                  ) : (
                    schedProcs.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/10">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{p.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">{p.arrivalTime} ms</td>
                        <td className="py-2.5 px-3 text-slate-300">{p.burstTime} ms</td>
                        <td className="py-2.5 px-3 text-slate-300">Priority {p.priority}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            id={`delete-sandbox-proc-${p.name}`}
                            onClick={() => handleDeleteProcess(p.id)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-red-950/20 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Output Pane */}
          {results && (
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-5 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-base text-white">Simulation Metrics Output</h3>
                <div className="flex gap-4 text-xs font-mono text-slate-400">
                  <span>Avg Wait: <strong className="text-emerald-400">{results.averageWaitingTime}ms</strong></span>
                  <span>Avg Turnaround: <strong className="text-violet-400">{results.averageTurnaroundTime}ms</strong></span>
                </div>
              </div>

              {/* Gantt chart section */}
              {renderGanttChart()}

              {/* Trace Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                      <th className="py-2 px-3">Process</th>
                      <th className="py-2 px-3">Arrival</th>
                      <th className="py-2 px-3">Burst</th>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Completion</th>
                      <th className="py-2 px-3">Turnaround</th>
                      <th className="py-2 px-3">Waiting Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50 text-slate-300">
                    {results.processes.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/10">
                        <td className="py-2.5 px-3 font-bold text-slate-100">{p.name}</td>
                        <td className="py-2.5 px-3">{p.arrivalTime}ms</td>
                        <td className="py-2.5 px-3">{p.burstTime}ms</td>
                        <td className="py-2.5 px-3">Priority {p.priority}</td>
                        <td className="py-2.5 px-3 text-cyan-400">{p.completionTime}ms</td>
                        <td className="py-2.5 px-3 text-violet-400 font-bold">{p.turnaroundTime}ms</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{p.waitingTime}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-violet-950/10 border border-violet-500/20 rounded-xl flex gap-2.5 items-start text-[11px] text-slate-400 font-sans">
                <HelpCircle size={15} className="text-violet-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-slate-200 block font-mono">Academic Formula Recall:</span>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px]">
                    <li><strong>Turnaround Time (TAT)</strong> = Completion Time - Arrival Time</li>
                    <li><strong>Waiting Time (WT)</strong> = Turnaround Time - Burst Time</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

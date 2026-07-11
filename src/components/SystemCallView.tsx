/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Cpu, 
  Database, 
  HardDrive, 
  Terminal, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { SystemCallStep } from '../types';

export default function SystemCallView() {
  const [selectedCall, setSelectedCall] = useState<string>('fork');
  const [steps, setSteps] = useState<SystemCallStep[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchTrace();
  }, [selectedCall]);

  // Handle auto-playing steps
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps]);

  const fetchTrace = async () => {
    try {
      const response = await fetch('/api/systemcalls/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syscall: selectedCall })
      });
      if (response.ok) {
        const data = await response.json();
        setSteps(data);
        setActiveStepIdx(0);
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('Syscall bus error:', e);
    }
  };

  const handleNext = () => {
    if (activeStepIdx < steps.length - 1) {
      setActiveStepIdx(activeStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (activeStepIdx > 0) {
      setActiveStepIdx(activeStepIdx - 1);
    }
  };

  const currentStep = steps[activeStepIdx];

  // Component render helpers for the visual architecture map
  const getComponentStatus = (compName: string) => {
    if (!currentStep) return 'border-slate-800 bg-slate-950/20 text-slate-500';
    if (currentStep.activeComponent === compName) {
      return 'border-violet-500 bg-violet-600/10 text-violet-300 shadow-md shadow-violet-500/10 scale-105';
    }
    return 'border-slate-800 bg-slate-900/40 text-slate-400';
  };

  return (
    <div id="syscalls-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-white">System Call Interrupt Simulator</h2>
        <p className="text-sm text-slate-400 font-sans mt-0.5">Study POSIX assembly traps. Visualize CPU transitions from unprivileged Ring 3 User threads into Ring 0 supervisor kernels.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Call Selector & Step description */}
        <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Info className="text-violet-400" size={18} />
            <h3 className="font-display font-bold text-base text-white">Select Interrupt Trap</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">POSX Instruction</label>
              <select
                id="syscall-select"
                value={selectedCall}
                onChange={(e) => setSelectedCall(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="fork">fork() - Duplicate Task Context</option>
                <option value="exec">exec() - Re-map address binary space</option>
                <option value="wait">wait() - Context sleep parent sync</option>
                <option value="exit">exit() - Release task PCB resources</option>
                <option value="open">open() - Allocate virtual FD index</option>
                <option value="close">close() - Flush disk stream buffer</option>
                <option value="read">read() - Read disk stream descriptors</option>
                <option value="write">write() - Write stdout stream logs</option>
              </select>
            </div>

            {/* Steps Controller */}
            {currentStep && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-violet-400 font-bold uppercase tracking-wider">STEP {activeStepIdx + 1} OF {steps.length}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">{currentStep.state}</span>
                </div>
                
                <h4 className="font-display font-bold text-sm text-slate-200">{currentStep.title}</h4>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">{currentStep.description}</p>
                
                {/* Manual step togglers */}
                <div className="flex gap-2 font-mono pt-1">
                  <button
                    id="syscall-prev-btn"
                    disabled={activeStepIdx === 0}
                    onClick={handlePrev}
                    className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 disabled:bg-slate-950 disabled:text-slate-700 border border-slate-800 hover:border-slate-700 transition-all text-[11px] font-bold flex justify-center items-center gap-1"
                  >
                    <ChevronLeft size={13} />
                    <span>BACK</span>
                  </button>
                  <button
                    id="syscall-next-btn"
                    disabled={activeStepIdx === steps.length - 1}
                    onClick={handleNext}
                    className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 disabled:bg-slate-950 disabled:text-slate-700 border border-slate-800 hover:border-slate-700 transition-all text-[11px] font-bold flex justify-center items-center gap-1"
                  >
                    <span>NEXT</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                <button
                  id="syscall-play-btn"
                  onClick={() => {
                    if (activeStepIdx === steps.length - 1) {
                      setActiveStepIdx(0);
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-full py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 hover:text-violet-300 border border-violet-500/30 transition-all font-mono text-[11px] font-bold flex items-center justify-center gap-1.5"
                >
                  <Play size={12} className={isPlaying ? 'animate-ping' : ''} />
                  <span>{isPlaying ? 'PAUSE AUTO-RUN' : 'AUTO-PLAY TRACE'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visual Dual-Mode Execution map */}
        <div className="xl:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col justify-between min-h-[400px]">
          
          <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center shrink-0">
            <h3 className="font-display font-bold text-base text-white">Core Memory Protection Privilege Traps</h3>
            <span className="font-mono text-xs text-slate-500">CURRENT_STATE: Ring {currentStep?.state.includes('Kernel') ? '0' : '3'} Mode</span>
          </div>

          {/* Graphical Privilege Ring Maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative flex-1 items-center">
            
            {/* Mode 1: Ring 3 - User Space */}
            <div className="p-4 border border-dashed border-slate-800 rounded-2xl space-y-4 relative bg-slate-950/20">
              <div className="absolute top-2.5 left-2.5 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unprivileged Ring 3 (User space)</div>
              
              <div className="grid grid-cols-2 gap-3 pt-4">
                {/* User App Node */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 h-28 transition-all duration-300 ${getComponentStatus('User App')}`}>
                  <Terminal size={22} className={currentStep?.activeComponent === 'User App' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">User Thread</span>
                  <span className="text-[9px] opacity-75 font-mono">/bin/bash</span>
                </div>

                {/* Shell Node */}
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 h-28 transition-all duration-300 ${getComponentStatus('Shell')}`}>
                  <Cpu size={22} className={currentStep?.activeComponent === 'Shell' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">Local Buffer</span>
                  <span className="text-[9px] opacity-75 font-mono">0x7ffd98</span>
                </div>
              </div>
            </div>

            {/* Divider Trap indicator */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 justify-center items-center font-mono text-[10px] text-slate-400 font-bold z-10 shadow-lg">
              INT
            </div>

            {/* Mode 2: Ring 0 - Supervisor Space */}
            <div className="p-4 border border-slate-800 rounded-2xl space-y-4 bg-slate-950/30 relative">
              <div className="absolute top-2.5 left-2.5 font-mono text-[10px] text-violet-400/80 font-bold uppercase tracking-wider">Supervisor Ring 0 (Kernel space)</div>
              
              <div className="grid grid-cols-2 gap-3 pt-4">
                {/* MicroKernel core dispatcher */}
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 h-24 transition-all duration-300 ${getComponentStatus('Kernel')}`}>
                  <Database size={18} className={currentStep?.activeComponent === 'Kernel' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">sys_trap()</span>
                  <span className="text-[8px] opacity-75 font-mono">Register AX</span>
                </div>

                {/* Core Execution scheduler CPU */}
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 h-24 transition-all duration-300 ${getComponentStatus('CPU')}`}>
                  <Cpu size={18} className={currentStep?.activeComponent === 'CPU' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">CPU Scheduler</span>
                  <span className="text-[8px] opacity-75 font-mono">Hardware Core</span>
                </div>

                {/* Physical RAM bounds protector */}
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 h-24 transition-all duration-300 ${getComponentStatus('RAM')}`}>
                  <Database size={18} className={currentStep?.activeComponent === 'RAM' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">Memory Manager</span>
                  <span className="text-[8px] opacity-75 font-mono">Page Framer</span>
                </div>

                {/* Underlying VFS controller */}
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 h-24 transition-all duration-300 ${getComponentStatus('FS')}`}>
                  <HardDrive size={18} className={currentStep?.activeComponent === 'FS' ? 'text-violet-400' : 'text-slate-600'} />
                  <span className="font-mono text-xs font-bold leading-none">Virtual FS</span>
                  <span className="text-[8px] opacity-75 font-mono">Inode streams</span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-3 bg-red-950/15 border border-red-900/30 rounded-xl flex gap-2.5 items-start text-[10px] text-slate-400 font-mono leading-normal mt-4">
            <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong>Academic Security Concept: Memory Protection Bounds</strong><br />
              Applications are forbidden from writing directly to RAM or physical disk sectors. They MUST set assembly flags inside hardware registers (e.g. AX) and execute <code>INT 0x80</code> software traps. The kernel intercepts, verifies pointer constraints, carries out the action in privilege Ring 0, and returns the descriptor handle.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

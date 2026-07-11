/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Info, Cpu, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export default function AboutView() {
  const keyboardShortcuts = [
    { keys: ['Ctrl', 'Shift', 'D'], desc: 'Go to System Dashboard overview' },
    { keys: ['Ctrl', 'Shift', 'P'], desc: 'Open Process Control table' },
    { keys: ['Ctrl', 'Shift', 'S'], desc: 'Execute CPU scheduler simulation' },
    { keys: ['Ctrl', 'Shift', 'M'], desc: 'Toggle RAM memory bounds protection' },
    { keys: ['Ctrl', 'Shift', 'F'], desc: 'Browse Virtual File System inodes' },
    { keys: ['Ctrl', 'Shift', 'T'], desc: 'Open interactive web terminal' }
  ];

  return (
    <div id="about-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl tracking-tight text-white">About MiniKernel OS Simulator</h2>
        <p className="text-sm text-slate-400 font-sans mt-0.5">Educational operating system sandbox designed to explain memory management registers, file stream allocation tables, and trap interfaces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project info card */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-violet-400" />
              <span>Project Abstract & Core Curriculum</span>
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This simulator serves as a university-grade student reference project, addressing the core pillars of computer architecture course syllabi: thread synchronization, scheduling algorithm fairness, internal/external fragmentation protection bounds, and inode file stream mapping.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
                <span className="font-mono text-[10px] text-violet-400 font-bold uppercase tracking-wider block">Course Name</span>
                <span className="font-sans text-xs font-bold text-slate-200">CS 304 - Advanced Operating Systems</span>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1">
                <span className="font-mono text-[10px] text-violet-400 font-bold uppercase tracking-wider block">Student Lab Group</span>
                <span className="font-sans text-xs font-bold text-slate-200">Group Theta-12 (Lab 04 Sector B)</span>
              </div>
            </div>
          </div>

          {/* Key theoretical modules explained */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3">
              Theoretical Simulator Specification Engine
            </h3>

            <div className="space-y-4">
              
              <div className="flex gap-3 items-start text-xs">
                <div className="p-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-lg shrink-0 mt-0.5">
                  <Cpu size={16} />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-slate-200">1. Preemptive vs. Cooperative Schedulers</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                    Simulate time-quantum dispatchers using Round Robin queues. Track how average turnarounds and waits fluctuate as a factor of quantum duration, FCFS arrival delays, or non-preemptive SJF workloads.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
                  <Layers size={16} />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-slate-200">2. Page-Frame Address Protection</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                    Visualize standard fit placement algorithms (First, Best, and Worst Fit). Study how variable task sizes create external fragmentation blocks, requiring segment coalescing or physical paging map relocations.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs">
                <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-slate-200">3. Traps & Privilege Mode Separation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                    Trace assembly-level trapping registers, validating how system components (such as hardware registers or file allocation descriptors) require Ring 3 trap switches to execute disk read operations under Ring 0 authority safely.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Sidebar: Shortcuts and specifications info */}
        <div className="space-y-6 h-fit">
          
          {/* Keyboard Shortcuts Pane */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Info size={16} className="text-violet-400" />
              <span>Keyboard Shortcuts</span>
            </h3>

            <div className="space-y-3 font-mono text-[11px]">
              {keyboardShortcuts.map((sc, i) => (
                <div key={i} className="flex justify-between items-center gap-4 py-1 border-b border-slate-900/40">
                  <span className="text-slate-400 font-sans text-xs">{sc.desc}</span>
                  <div className="flex gap-1 shrink-0">
                    {sc.keys.map((k, idx) => (
                      <kbd key={idx} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold text-[9px] text-slate-300">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Spec Table */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-2">
              Lab Specifications
            </h3>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <div className="flex justify-between border-b border-slate-900/40 pb-1"><span>Target Architecture</span><span className="text-slate-200 font-bold">POSIX x86-64</span></div>
              <div className="flex justify-between border-b border-slate-900/40 pb-1"><span>Page Size Limit</span><span className="text-slate-200">64 KB per frame</span></div>
              <div className="flex justify-between border-b border-slate-900/40 pb-1"><span>Ram Capacity</span><span className="text-slate-200">1024 KB Physical</span></div>
              <div className="flex justify-between border-b border-slate-900/40 pb-1"><span>Interrupt Trap Vector</span><span className="text-slate-200">INT 0x80 Handler</span></div>
              <div className="flex justify-between"><span>VFS Partition ID</span><span className="text-slate-200">0xEF02 (Virtual ext4)</span></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Layers, 
  RotateCcw, 
  ShieldAlert, 
  Settings, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { MemoryBlock, PageEntry } from '../types';

export default function MemoryView() {
  const [blocks, setBlocks] = useState<MemoryBlock[]>([]);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'contiguous' | 'paging' | 'segmentation'>('contiguous');
  
  // Allocate contiguous memory form states
  const [procName, setProcName] = useState('');
  const [memSize, setMemSize] = useState(64);
  const [algo, setAlgo] = useState<'FirstFit' | 'BestFit' | 'WorstFit'>('FirstFit');
  
  // Error / Stats states
  const [allocError, setAllocError] = useState('');
  const [externalFrag, setExternalFrag] = useState<number | null>(null);

  // Segmentation States
  const [selectedSegProc, setSelectedSegProc] = useState('systemd');
  const [segments, setSegments] = useState([
    { id: 0, name: 'Code Segment', base: 512, limit: 120, description: 'Read-only binary instructions' },
    { id: 1, name: 'Data Segment', base: 640, limit: 80, description: 'Global and static variable structures' },
    { id: 2, name: 'Heap Segment', base: 736, limit: 160, description: 'Dynamic allocated variables' },
    { id: 3, name: 'Stack Segment', base: 920, limit: 64, description: 'Local function call activation records' }
  ]);
  const [calcSegId, setCalcSegId] = useState(0);
  const [calcOffset, setCalcOffset] = useState(50);
  const [calcResult, setCalcResult] = useState<{ physicalAddr: number; error: boolean; details: string } | null>(null);

  // Load initial RAM configuration on mount
  useEffect(() => {
    fetchMemoryState();
  }, []);

  const fetchMemoryState = async () => {
    try {
      const response = await fetch('/api/memory/state');
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks);
        setPages(data.pages);
      }
    } catch (e) {
      console.error('Failed reading virtual memory bus:', e);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError('');
    setExternalFrag(null);

    if (!procName.trim()) {
      setAllocError('Process Name is required.');
      return;
    }

    const cleanName = procName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10);

    try {
      const response = await fetch('/api/memory/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processName: cleanName,
          size: Number(memSize),
          algorithm: algo
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks);
        setProcName('');
        setMemSize(64);
        // Sync full state
        fetchMemoryState();
      } else {
        const errData = await response.json();
        setAllocError(errData.error);
        if (errData.externalFragmentation !== undefined) {
          setExternalFrag(errData.externalFragmentation);
        }
      }
    } catch (error) {
      console.error('Memory bus interrupt error:', error);
    }
  };

  const handleDeallocate = async (blockId: string) => {
    try {
      const response = await fetch('/api/memory/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId })
      });

      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks);
        setAllocError('');
        setExternalFrag(null);
        // Sync full state
        fetchMemoryState();
      }
    } catch (e) {
      console.error('Deallocation error:', e);
    }
  };

  const handleResetMemory = async () => {
    try {
      const response = await fetch('/api/memory/reset', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks);
        setPages(data.pages);
        setAllocError('');
        setExternalFrag(null);
      }
    } catch (e) {
      console.error('Resetting memory bus error:', e);
    }
  };

  // Calculate total statistics
  const totalRamCapacity = 1024; // 1024 KB
  const totalAllocatedRam = blocks.filter(b => b.allocated).reduce((sum, b) => sum + b.size, 0);
  const totalFreeRam = totalRamCapacity - totalAllocatedRam;
  const totalInternalFrag = blocks.filter(b => b.allocated).reduce((sum, b) => sum + (b.internalFragmentation || 0), 0);

  return (
    <div id="memory-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">Memory Management Unit (MMU)</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Simulate contiguous partition fit systems or physical page-frame table translation caches.</p>
        </div>
        <button
          id="reset-ram-btn"
          onClick={handleResetMemory}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold text-slate-300 transition-all"
        >
          <RotateCcw size={13} />
          <span>RESET MEMORY BUS</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-1.5 shrink-0 font-mono text-xs">
        <button
          id="contiguous-tab-btn"
          onClick={() => setActiveTab('contiguous')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'contiguous' 
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Contiguous Alloc (Fit Algorithms)
        </button>
        <button
          id="paging-tab-btn"
          onClick={() => setActiveTab('paging')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'paging' 
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Physical Paging Frames
        </button>
        <button
          id="segmentation-tab-btn"
          onClick={() => {
            setActiveTab('segmentation');
            setCalcResult(null);
          }}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'segmentation' 
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Segmentation Map
        </button>
      </div>

      {activeTab === 'contiguous' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Alloc Form */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="text-violet-400" size={18} />
              <h3 className="font-display font-bold text-base text-white">Allocate RAM Segment</h3>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4 font-sans">
              {allocError && (
                <div className="p-3 rounded-lg bg-red-950/35 border border-red-900/50 text-red-400 text-xs flex flex-col gap-1">
                  <div className="flex gap-2 items-center font-bold">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>Allocation Error</span>
                  </div>
                  <span className="text-[11px] leading-snug">{allocError}</span>
                  {externalFrag !== null && externalFrag > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-red-900/40 text-[10px] text-red-300 leading-normal">
                      <strong>External Fragmentation Detected:</strong> We have {externalFrag}KB of total free memory, but it resides in non-contiguous segments. Compaction is required!
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Segment Owner Process</label>
                <input
                  id="mem-proc-name"
                  type="text"
                  placeholder="e.g. apache_worker"
                  value={procName}
                  onChange={(e) => setProcName(e.target.value)}
                  maxLength={10}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Requested Size (KB)</label>
                <div className="space-y-2">
                  <input
                    id="mem-size-input"
                    type="range"
                    min={8}
                    max={256}
                    step={8}
                    value={memSize}
                    onChange={(e) => setMemSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-xs font-mono text-slate-500">
                    <span>8KB</span>
                    <span className="text-violet-400 font-bold">{memSize} KB</span>
                    <span>256KB</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Placement Strategy</label>
                <select
                  id="mem-algo-select"
                  value={algo}
                  onChange={(e) => setAlgo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="FirstFit">First Fit (Pick first large block)</option>
                  <option value="BestFit">Best Fit (Minimize leftover size)</option>
                  <option value="WorstFit">Worst Fit (Maximize leftover size)</option>
                </select>
              </div>

              <button
                id="mem-allocate-submit"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-mono font-bold text-xs tracking-wider text-white shadow-md hover:shadow-violet-500/20 transition-all border border-violet-400/20"
              >
                REQUEST CONTIGUOUS BLOCK
              </button>
            </form>

            {/* Fragmentation Statistics */}
            <div className="border-t border-slate-800/60 pt-4 mt-2 space-y-2.5 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>TOTAL INSTALLED RAM</span>
                <span className="text-slate-200">1024 KB</span>
              </div>
              <div className="flex justify-between">
                <span>FREE FRAGMENT BLOCKS</span>
                <span className="text-emerald-400 font-bold">{totalFreeRam} KB ({Math.round(totalFreeRam/totalRamCapacity*100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>INTERNAL FRAGMENTATION</span>
                <span className="text-amber-400 font-bold">{totalInternalFrag} KB</span>
              </div>
            </div>
          </div>

          {/* Graphical RAM Layout & Block Tables */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Visual RAM block array */}
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3">
                Physical Contiguous RAM Map (0 - 1024KB)
              </h3>

              {/* Graphical Blocks row */}
              <div className="w-full h-16 bg-slate-950 rounded-xl border border-slate-900 overflow-hidden flex relative p-1 gap-1">
                {blocks.map((block) => {
                  const widthPct = (block.size / totalRamCapacity) * 100;
                  return (
                    <div
                      key={block.id}
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-lg flex flex-col justify-center items-center text-center px-1 font-mono text-[10px] transition-all duration-300 relative group overflow-hidden ${
                        block.allocated
                          ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300 shadow-inner'
                          : 'bg-slate-900/40 border border-slate-800 border-dashed text-slate-600'
                      }`}
                    >
                      <span className="font-bold truncate max-w-full">
                        {block.allocated ? block.processName : 'Free'}
                      </span>
                      <span className="text-[8px] opacity-75">{block.size}KB</span>
                      
                      {/* Tooltip for hover internal details */}
                      <div className="absolute inset-0 bg-slate-950/90 text-[9px] flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity p-1 select-none pointer-events-none">
                        <span>Size: {block.size}KB</span>
                        {block.allocated && (
                          <span className="text-amber-400">Int Frag: {block.internalFragmentation}KB</span>
                        )}
                        <span>Range: {block.start}-{block.start + block.size}KB</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Address labels underneath the array */}
              <div className="w-full flex justify-between font-mono text-[9px] text-slate-500 px-1 mt-1">
                <span>0 KB</span>
                <span>256 KB</span>
                <span>512 KB</span>
                <span>768 KB</span>
                <span>1024 KB</span>
              </div>
            </div>

            {/* Block allocation detailed table list */}
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5">
              <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 mb-4">
                Active RAM Partition Table
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                      <th className="py-2 px-3">Base Address</th>
                      <th className="py-2 px-3">Block Size</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Allocated Process</th>
                      <th className="py-2 px-3">Internal Frag</th>
                      <th className="py-2 px-3 text-right">Interrupt actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {blocks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/10">
                        <td className="py-2.5 px-3 font-bold text-slate-300">{b.start} KB</td>
                        <td className="py-2.5 px-3 text-slate-300">{b.size} KB</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.allocated 
                              ? 'bg-violet-950/50 text-violet-400 border border-violet-800/40' 
                              : 'bg-slate-900 text-slate-500'
                          }`}>
                            {b.allocated ? 'Allocated' : 'Free Segment'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-bold">{b.processName || '-'}</td>
                        <td className="py-2.5 px-3">
                          {b.allocated ? (
                            <span className={b.internalFragmentation ? 'text-amber-400' : 'text-slate-500'}>
                              {b.internalFragmentation} KB
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {b.allocated && (
                            <button
                              id={`dealloc-block-btn-${b.id}`}
                              onClick={() => handleDeallocate(b.id)}
                              className="text-red-400 hover:text-red-300 hover:underline hover:bg-red-950/20 px-2 py-1 rounded transition-all text-[11px]"
                            >
                              RELEASE
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      ) : activeTab === 'paging' ? (
        /* Paging Mode display */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Explanation panel */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="text-blue-400" size={18} />
              <h3 className="font-display font-bold text-base text-white">Paging Cache Controls</h3>
            </div>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              In physical paging systems, virtual memory addresses are divided into fixed-size units called <strong>Pages</strong>, translating into corresponding physical <strong>Frames</strong> via the Kernel Page Table Cache.
            </p>

            <div className="p-3 bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>TOTAL RAM</span>
                <span className="text-slate-200">1024 KB</span>
              </div>
              <div className="flex justify-between">
                <span>FRAME SIZE</span>
                <span className="text-slate-200">64 KB</span>
              </div>
              <div className="flex justify-between">
                <span>FRAME COUNT</span>
                <span className="text-blue-400 font-bold">16 FRAMES</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] text-slate-500 leading-normal font-mono">
              <span className="text-slate-300 font-bold block mb-1">Translational Logic:</span>
              Since page frames are completely uniform in size, <strong>Internal Fragmentation is minimized</strong>, and <strong>External Fragmentation is 100% eliminated</strong>. Processes can populate non-contiguous frames seamlessly!
            </div>
          </div>

          {/* Frames Visual Grid */}
          <div className="lg:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3">
              Physical Page Frame Table (Frame Address Register Mapping)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pages.map((p) => (
                <div
                  key={p.pageId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between h-24 font-mono text-xs transition-all duration-300 relative group overflow-hidden ${
                    p.allocated
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-300 shadow-inner'
                      : 'bg-slate-900/30 border-slate-800/80 text-slate-600 border-dashed'
                  }`}
                >
                  <div className="flex justify-between text-[9px] opacity-75 font-bold">
                    <span>FRAME {p.frameId.toString().padStart(2, '0')}</span>
                    <span className={p.allocated ? 'text-blue-400' : 'text-slate-600'}>
                      {p.allocated ? 'ALLOC' : 'EMPTY'}
                    </span>
                  </div>
                  
                  <div className="my-1 text-center font-sans font-bold text-sm truncate text-slate-200">
                    {p.allocated ? p.processName : '-'}
                  </div>

                  <div className="flex justify-between text-[8px] opacity-75 mt-0.5">
                    <span>Base: {p.frameId * 64}K</span>
                    <span>Page {p.pageId}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-950/10 border border-blue-500/20 rounded-xl flex gap-2.5 items-start text-[11px] text-slate-400 font-sans">
              <HelpCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-slate-200 block font-mono">Paging Advantage:</span>
                Note how frames assigned to 'systemd' or 'kthreadd' don't need to be contiguous! Address relocation registers handles translating logic maps dynamically.
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Segmentation Mode Display */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in font-sans">
          
          {/* Segment Table */}
          <div className="lg:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="font-display font-bold text-base text-white">
                Active Segmentation Register Mapping Table
              </h3>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-900/40 px-2 py-0.5 rounded-lg">
                VARIABLE_SIZE_BOUNDS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="py-2 px-3">Segment ID</th>
                    <th className="py-2 px-3">Segment Name</th>
                    <th className="py-2 px-3">Base Address</th>
                    <th className="py-2 px-3">Limit (Size)</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-3 font-bold text-rose-400">SEG {seg.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-200">{seg.name}</td>
                      <td className="py-3 px-3 text-slate-300">0x{seg.base.toString(16).toUpperCase().padStart(4, '0')} ({seg.base} KB)</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">{seg.limit} KB</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">{seg.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual segment blocks */}
            <div className="space-y-2.5 mt-2">
              <span className="text-xs font-mono text-slate-400 block uppercase tracking-wider font-bold">Logical Address Layout Map (Variable Segments)</span>
              <div className="h-10 bg-slate-950 rounded-xl border border-slate-900 flex p-1 gap-1 font-mono text-[10px]">
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    className="h-full rounded-lg bg-rose-600/15 border border-rose-500/25 text-rose-300 flex flex-col justify-center items-center text-center px-2 flex-1"
                  >
                    <span className="font-bold truncate">{seg.name}</span>
                    <span className="text-[8px] opacity-75">{seg.limit}KB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Address Translation Unit (ATU) Simulator */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Settings className="text-rose-400" size={18} />
                <span>Segmentation Translation Unit</span>
              </h3>

              <div className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Select Segment Selector</label>
                  <select
                    value={calcSegId}
                    onChange={(e) => setCalcSegId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-2.5 py-2 font-mono"
                  >
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>SEG {s.id} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Logical Offset Address (KB)</label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={calcOffset}
                    onChange={(e) => setCalcOffset(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <button
                  onClick={() => {
                    const seg = segments.find(s => s.id === calcSegId)!;
                    if (calcOffset >= seg.limit) {
                      setCalcResult({
                        physicalAddr: -1,
                        error: true,
                        details: `SEGMENTATION VIOLATION! Offset ${calcOffset}KB exceeds segment limit of ${seg.limit}KB. CPU registers triggered memory protection interrupt (TRAP).`
                      });
                    } else {
                      const phys = seg.base + calcOffset;
                      setCalcResult({
                        physicalAddr: phys,
                        error: false,
                        details: `Address Translated Successfully: Physical Address is 0x${phys.toString(16).toUpperCase().padStart(4, '0')} (${phys} KB).`
                      });
                    }
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-xl shadow-md border border-rose-400/20"
                >
                  TRANSLATE LOGICAL ADDRESS
                </button>
              </div>
            </div>

            {/* Translation Result Panel */}
            {calcResult && (
              <div className={`p-3 rounded-xl border font-mono text-xs mt-4 ${
                calcResult.error 
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-400' 
                  : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1 text-[10px]">
                  <ShieldAlert size={14} />
                  <span>{calcResult.error ? 'CPU INTERRUPT: SIGSEGV' : 'ADDRESS TRANSLATION OK'}</span>
                </div>
                <p className="font-sans text-[11px] leading-relaxed">{calcResult.details}</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Shield, HelpCircle, CornerDownLeft } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output';
  text: string;
}

export default function TerminalView() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', text: 'MiniKernel Cyber Shell [Version 1.0.4]' },
    { type: 'output', text: '(C) 2026 Academic Operating System Sandbox Project. All rights reserved.' },
    { type: 'output', text: "Type 'help' to show all available terminal commands." },
    { type: 'output', text: ' ' }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to end on history updates
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Focus terminal input on load or when clicking the terminal panel
  useEffect(() => {
    focusInput();
  }, []);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    // Append user input to terminal list
    const newHistoryEntry: TerminalLine = { type: 'input', text: `admin@minikernel:~$ ${cmd}` };
    setHistory(prev => [...prev, newHistoryEntry]);
    
    // Save to command history buffer
    const updatedCmdHistory = [...commandHistory, cmd];
    setCommandHistory(updatedCmdHistory);
    setHistoryIdx(updatedCmdHistory.length);

    setInput('');

    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          currentFolderId: 'root' // Assume root folder context for terminal execution
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.output === '__CLEAR_SCREEN__') {
          setHistory([]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: data.output }]);
        }
      }
    } catch (err) {
      setHistory(prev => [...prev, { type: 'output', text: 'bash: network interrupt calling kernel bus.' }]);
    }
  };

  // Keystroke listeners (Up/Down for command recall, Tab for autocomplete)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIdx = Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(commandHistory[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = historyIdx + 1;
      if (newIdx >= commandHistory.length) {
        setHistoryIdx(commandHistory.length);
        setInput('');
      } else {
        setHistoryIdx(newIdx);
        setInput(commandHistory[newIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab autocompletion simulation for common commands
      const currentInput = input.trim().toLowerCase();
      const commands = [
        'help', 'clear', 'ls', 'pwd', 'mkdir', 'touch', 'cat', 'rm', 
        'cp', 'mv', 'date', 'time', 'ps', 'kill', 'mem', 'cpu', 'history', 'whoami', 'echo'
      ];
      const match = commands.find(c => c.startsWith(currentInput));
      if (match) {
        setInput(match + ' ');
      }
    }
  };

  return (
    <div id="terminal-view-container" className="p-6 space-y-6 flex flex-col h-full text-slate-100 overflow-hidden">
      
      {/* Page Header */}
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">Interactive Terminal Shell</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Dual-privilege terminal console simulating virtual hardware clock interrupts, process termination, and memory page ranges.</p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            <Shield size={12} />
            <span>ROOT_PRIVILEGE</span>
          </span>
        </div>
      </div>

      {/* Main Terminal Shell Box */}
      <div 
        id="terminal-box"
        onClick={focusInput}
        className="flex-1 glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col font-mono text-xs overflow-hidden cursor-text glow-blue"
      >
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 shrink-0 text-slate-500 text-[10px]">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-violet-500 animate-pulse" />
            <span className="font-bold">admin@minikernel: ~</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
          </div>
        </div>

        {/* Lines History */}
        <div id="terminal-history" className="flex-1 overflow-y-auto space-y-2 pr-1 select-text">
          {history.map((line, index) => (
            <div 
              key={index} 
              className={`whitespace-pre-wrap leading-relaxed ${
                line.type === 'input' 
                  ? 'text-violet-300 font-bold' 
                  : line.text.includes('error') || line.text.includes('not found')
                  ? 'text-red-400'
                  : 'text-slate-300'
              }`}
            >
              {line.text}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Live Input Stream Row */}
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-900 shrink-0 font-bold text-violet-400">
          <span>admin@minikernel:~$</span>
          <div className="flex-1 flex items-center relative">
            <input
              id="terminal-keyboard-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-100 font-mono caret-transparent"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
            />
            {/* Custom Terminal Cursor blinking */}
            <span 
              className="absolute pointer-events-none text-slate-300 caret-blink text-sm"
              style={{ left: `${Math.min(98, input.length * 7.4)}px`, top: '-1px' }}
            >
              _
            </span>
          </div>
          <CornerDownLeft size={12} className="text-slate-600 shrink-0" />
        </form>
      </div>

      {/* Cheat-sheet summary bar */}
      <div className="shrink-0 p-4 bg-slate-900/30 border border-slate-800 rounded-xl flex gap-3 items-start text-[11px] text-slate-400 leading-normal font-sans">
        <HelpCircle size={15} className="text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300 block font-mono mb-0.5">Quick Commands Reference:</span>
          <div className="font-mono text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            <span><strong>ls</strong> (list files)</span>
            <span><strong>cat readme.txt</strong> (read file)</span>
            <span><strong>ps</strong> (processes)</span>
            <span><strong>kill [pid]</strong> (stop tasks)</span>
            <span><strong>mem</strong> (RAM segments)</span>
            <span><strong>cpu</strong> (multi-core load)</span>
          </div>
        </div>
      </div>

    </div>
  );
}

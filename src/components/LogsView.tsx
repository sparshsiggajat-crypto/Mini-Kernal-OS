/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  ClipboardList, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { LogEntry, LogLevel } from '../types';

interface LogsViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
}

export default function LogsView({ logs, onClearLogs, onRefreshLogs }: LogsViewProps) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) || 
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      log.status.toLowerCase().includes(search.toLowerCase());
    
    const matchesLevel = levelFilter === 'All' ? true : log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Export logs to a local file
  const handleExportLogs = () => {
    const textContent = logs.map(log => {
      return `[${log.timestamp}] [${log.level}] [${log.action}] [${log.status}] ${log.details || ''}`;
    }).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minikernel_system_logs_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const levelColors: Record<LogLevel, string> = {
    SUCCESS: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    INFO: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    WARNING: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    ERROR: 'text-red-400 border-red-500/20 bg-red-500/5',
  };

  return (
    <div id="logs-view-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100 flex flex-col">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">System Audit Trail</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5 font-bold uppercase tracking-wider text-[11px] text-violet-400">Security Ring 0 System Loggers</p>
        </div>
        <div className="flex gap-2 font-mono text-xs w-full sm:w-auto">
          <button
            id="logs-refresh-btn"
            onClick={onRefreshLogs}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 transition-all cursor-pointer font-bold"
          >
            <RefreshCw size={12} />
            <span>PULL FEED</span>
          </button>
          <button
            id="logs-export-btn"
            onClick={handleExportLogs}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 transition-all cursor-pointer font-bold"
          >
            <Download size={12} />
            <span>EXPORT TXT</span>
          </button>
          <button
            id="logs-clear-btn"
            onClick={onClearLogs}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 transition-all cursor-pointer font-bold"
          >
            <Trash2 size={12} />
            <span>FLUSH CORE</span>
          </button>
        </div>
      </div>

      {/* Table controls */}
      <div className="glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-full overflow-hidden flex-1">
        
        {/* Search / filter header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="relative w-full sm:w-72 font-sans">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              id="logs-search-input"
              type="text"
              placeholder="Search kernel action or log records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 font-mono transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto justify-end">
            <SlidersHorizontal size={14} className="text-slate-500" />
            <span className="text-slate-400">SEVERITY LEVEL:</span>
            <select
              id="logs-level-filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="All">All Severity Levels</option>
              <option value="INFO">INFO Streams</option>
              <option value="SUCCESS">SUCCESS Bounds</option>
              <option value="WARNING">WARNING Flags</option>
              <option value="ERROR">ERROR Traps</option>
            </select>
          </div>
        </div>

        {/* Logs Stream List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 italic font-mono">
              No system log records match active search queries or level parameters.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition-all hover:bg-slate-900/10 ${levelColors[log.level as LogLevel] || 'text-slate-300 border-slate-800 bg-slate-900/20'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                      {log.level}
                    </span>
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] opacity-75">({log.status})</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed text-[11px]">{log.details}</p>
                </div>
                
                <div className="text-[10px] text-slate-500 text-right shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footnote stats count */}
        <div className="border-t border-slate-900 pt-3 mt-3 shrink-0 flex justify-between font-mono text-[10px] text-slate-500">
          <span>TOTAL LOG EVENTS RECORDED: {logs.length}</span>
          <span>FILTERED EVENTS: {filteredLogs.length}</span>
        </div>

      </div>
    </div>
  );
}

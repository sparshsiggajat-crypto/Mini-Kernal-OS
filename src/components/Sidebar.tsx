/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  Layers, 
  HardDrive, 
  Terminal as TerminalIcon, 
  Code2, 
  ClipboardList, 
  Info, 
  LogOut,
  User as UserIcon,
  Wifi,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  cpuUsage: number;
  ramUsagePercent: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  cpuUsage,
  ramUsagePercent
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'scheduler', label: 'CPU Scheduler', icon: Cpu },
    { id: 'memory', label: 'Memory Manager', icon: Layers },
    { id: 'filesystem', label: 'File System', icon: HardDrive },
    { id: 'terminal', label: 'Terminal Shell', icon: TerminalIcon },
    { id: 'devicenetwork', label: 'Hardware & Net', icon: Wifi },
    { id: 'systemcalls', label: 'Syscall Simulator', icon: Code2 },
    { id: 'logs', label: 'System Logs', icon: ClipboardList },
  ];

  // Only show Admin Panel if user is logged in and has 'admin' role
  const showAdmin = currentUser && currentUser.role === 'admin';
  const visibleMenuItems = [...menuItems];
  if (showAdmin) {
    visibleMenuItems.push({ id: 'admin', label: 'Admin Accounts', icon: ShieldAlert });
  }
  visibleMenuItems.push({ id: 'about', label: 'About OS', icon: Info });

  return (
    <aside id="sidebar-container" className="w-64 glassmorphism border-r border-slate-800 flex flex-col h-full text-slate-300">
      {/* OS Branding logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-lg shadow-violet-500/20">
          K
        </div>
        <div>
          <h1 className="font-display font-bold text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MiniKernel OS
          </h1>
          <span className="font-mono text-[10px] tracking-wider text-violet-400">SIMULATOR V1.0</span>
        </div>
      </div>

      {/* User Status Card */}
      {currentUser && (
        <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <UserIcon size={18} />
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-sm text-slate-200 truncate">{currentUser.username}</div>
            <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">{currentUser.role}</div>
          </div>
        </div>
      )}

      {/* Menu list */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-violet-600/30 to-blue-500/10 border-l-2 border-violet-500 text-white shadow-sm' 
                  : 'hover:bg-slate-800/40 hover:text-slate-100 text-slate-400'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Resource meters quick widget */}
      <div className="p-4 border-t border-slate-800 space-y-3 font-mono text-[11px] bg-slate-950/20">
        <div>
          <div className="flex justify-between mb-1 text-slate-400">
            <span>CPU Core</span>
            <span className="text-violet-400">{cpuUsage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500" 
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-slate-400">
            <span>RAM (Paging)</span>
            <span className="text-blue-400">{ramUsagePercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" 
              style={{ width: `${ramUsagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          id="logout-btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-500/40 transition-all duration-200 text-xs font-mono tracking-wide"
        >
          <LogOut size={14} />
          <span>SHUTDOWN SESSION</span>
        </button>
      </div>
    </aside>
  );
}

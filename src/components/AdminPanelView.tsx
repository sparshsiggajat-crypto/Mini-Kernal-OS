/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Key, 
  Lock, 
  CheckCircle, 
  Fingerprint, 
  FileText,
  LockKeyhole
} from 'lucide-react';

interface UserItem {
  username: string;
  role: string;
  passwordHash: string;
}

interface AdminPanelViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function AdminPanelView({ showToast }: AdminPanelViewProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Confirmation state for deleting a user
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Registration States
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Security Policy States
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [minPassLength, setMinPassLength] = useState(8);
  const [failedLoginLimit, setFailedLoginLimit] = useState(3);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed fetching user list:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError('Username and password are required.');
      return;
    }

    if (regPassword.length < minPassLength) {
      setRegError(`Password is too short. Security policy enforces minimum ${minPassLength} characters.`);
      return;
    }

    const cleanUser = regUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUser) {
      setRegError('Username can only contain letters, numbers, hyphens and underscores.');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: regPassword,
          role: regRole
        })
      });

      if (response.ok) {
        setRegSuccess(`Account '${cleanUser}' successfully registered in core shadows.`);
        setRegUsername('');
        setRegPassword('');
        fetchUsers();
      } else {
        const err = await response.json();
        setRegError(err.error || 'Failed creating user.');
      }
    } catch (e) {
      setRegError('Communication interrupt with admin endpoints.');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      if (showToast) {
        showToast('Cannot delete the primary administrative system account!', 'error');
      }
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${username}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (showToast) {
          showToast(`User account '${username}' successfully deleted.`, 'warning');
        }
        fetchUsers();
      } else {
        const err = await response.json();
        if (showToast) {
          showToast(err.error || 'Failed deleting user.', 'error');
        }
      }
    } catch (e) {
      console.error('Error deleting user account:', e);
      if (showToast) {
        showToast('Communication interrupt during user deletion.', 'error');
      }
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div id="admin-panel-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100 flex flex-col">
      
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">System Administration Panel</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Manage virtual shadow passwords, assign role permissions, and check cryptographic security lock limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
        
        {/* User Account List */}
        <div className="xl:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Users className="text-violet-400" size={18} />
            <span>Active Users Shadow Database (/etc/shadow)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-3">Username</th>
                  <th className="py-2 px-3">Shadow Hash Represent</th>
                  <th className="py-2 px-3">System Role</th>
                  <th className="py-2 px-3 text-right">Delete Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {users.map((u) => (
                  <tr key={u.username} className="hover:bg-slate-900/10">
                    <td className="py-3 px-3 font-bold text-slate-200">
                      {u.username}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-[180px]">
                      {u.passwordHash}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' 
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' 
                          : 'bg-violet-950/40 text-violet-400 border border-violet-900/40'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.username !== 'admin' ? (
                        <button
                          onClick={() => setUserToDelete(u.username)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Purge user account shadow"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Registration Form & Policies */}
        <div className="space-y-6">
          
          {/* Create User Block */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <UserPlus className="text-violet-400" size={18} />
              <span>Register User Node</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
              {regError && (
                <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 rounded-lg flex gap-1.5 font-bold font-mono">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-lg flex gap-1.5 font-bold font-mono">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Account Username</label>
                <input
                  type="text"
                  placeholder="e.g. j_smith"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">User Password</label>
                <input
                  type="password"
                  placeholder="Minimum character threshold"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Privilege Ring (Role)</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-2.5 py-2 font-mono"
                >
                  <option value="student">Student / Ring 3 User</option>
                  <option value="admin">Admin / Ring 0 Root</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 font-mono font-bold text-xs tracking-wider text-white rounded-xl shadow-md transition-all border border-violet-400/15"
              >
                COMMIT REGISTER ENTRY
              </button>
            </form>
          </div>

          {/* Security Policies block */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 font-sans text-xs">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <LockKeyhole className="text-rose-400" size={18} />
              <span>Core PAM Security Policies</span>
            </h3>

            <div className="space-y-4">
              {/* MFA Toggle */}
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <div>
                  <span className="font-bold text-slate-200 block">Enforce Core Multi-Factor</span>
                  <span className="text-[10px] text-slate-500 font-mono">Requires secondary PIN token</span>
                </div>
                <button 
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className="text-slate-400 hover:text-white transition-all focus:outline-none"
                >
                  <Fingerprint size={22} className={mfaEnabled ? 'text-rose-400 animate-pulse' : 'text-slate-600'} />
                </button>
              </div>

              {/* Min Length */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>MIN SHADOW PASSWORD LENGTH</span>
                  <span className="text-rose-400 font-bold">{minPassLength} CHARS</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={16}
                  step={1}
                  value={minPassLength}
                  onChange={(e) => setMinPassLength(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                />
              </div>

              {/* Max failed logins */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>PAM FAILED LOCKOUT LIMIT</span>
                  <span className="text-rose-400 font-bold">{failedLoginLimit} TRIES</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={5}
                  step={1}
                  value={failedLoginLimit}
                  onChange={(e) => setFailedLoginLimit(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Custom Confirm Delete Modal */}
      {userToDelete && (
        <div id="delete-user-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-500 animate-pulse" size={20} />
              <span>Confirm Node Deletion</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to delete user account <strong className="text-rose-400 font-mono">'{userToDelete}'</strong> from shadow directories? This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-3 pt-2 font-mono text-xs">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all cursor-pointer"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

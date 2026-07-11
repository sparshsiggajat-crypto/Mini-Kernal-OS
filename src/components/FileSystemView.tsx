/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  FileText, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  ExternalLink, 
  Search, 
  HardDrive,
  Save,
  FolderOpen
} from 'lucide-react';
import { FileNode } from '../types';

export default function FileSystemView() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [search, setSearch] = useState('');
  
  // Selection and editing states
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  // Creation dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState('');

  // Rename states
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  // Move states
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>('root');

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const response = await fetch('/api/filesystem/tree');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (e) {
      console.error('VFS bus fetch error:', e);
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createName.trim()) {
      setCreateError('Name is required.');
      return;
    }

    const cleanedName = createName.trim().replace(/[^a-zA-Z0-9_\.-]/g, '');
    if (!cleanedName) {
      setCreateError('Valid alphanumeric characters required.');
      return;
    }

    try {
      const response = await fetch('/api/filesystem/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanedName,
          type: createType,
          parentId: currentFolderId,
          content: createType === 'file' ? 'New text file stream...' : ''
        })
      });

      if (response.ok) {
        fetchTree();
        setShowCreateModal(false);
        setCreateName('');
      } else {
        const errData = await response.json();
        setCreateError(errData.error);
      }
    } catch (e) {
      console.error('Create nodes VFS error:', e);
    }
  };

  const handleDeleteNode = async (fileId: string) => {
    if (fileId === 'root') return;
    try {
      const response = await fetch('/api/filesystem/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      if (response.ok) {
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
          setIsEditingContent(false);
        }
        fetchTree();
      }
    } catch (e) {
      console.error('Delete VFS link error:', e);
    }
  };

  const handleRenameNode = async (fileId: string) => {
    if (!renameName.trim()) return;
    try {
      const response = await fetch('/api/filesystem/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, newName: renameName.trim() })
      });
      if (response.ok) {
        setRenameFileId(null);
        setRenameName('');
        fetchTree();
      }
    } catch (e) {
      console.error('Rename VFS link error:', e);
    }
  };

  const handleSaveFileContent = async () => {
    if (!selectedFile) return;
    try {
      const response = await fetch('/api/filesystem/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFile.id, content: editorContent })
      });
      if (response.ok) {
        const updatedFile = await response.json();
        setSelectedFile(updatedFile);
        setIsEditingContent(false);
        fetchTree();
      }
    } catch (e) {
      console.error('Write file VFS stream error:', e);
    }
  };

  const handleCopyFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/filesystem/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, targetFolderId: currentFolderId })
      });
      if (response.ok) {
        fetchTree();
      }
    } catch (e) {
      console.error('Copy file VFS stream error:', e);
    }
  };

  const handleMoveFileSubmit = async () => {
    if (!moveFileId) return;
    try {
      const response = await fetch('/api/filesystem/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: moveFileId, targetFolderId: moveFolderId })
      });
      if (response.ok) {
        setMoveFileId(null);
        fetchTree();
      }
    } catch (e) {
      console.error('Move file VFS error:', e);
    }
  };

  // Directory navigation details
  const currentFolder = files.find(f => f.id === currentFolderId || currentFolderId === 'root');
  
  // Find relative children of active folder
  const currentLevelItems = files.filter(f => f.parentId === currentFolderId);
  
  // Search filtering
  const filteredItems = currentLevelItems.filter(f => {
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  // Folder path breadcrumb generator
  const getBreadcrumbs = () => {
    const crumbs: { id: string; name: string }[] = [];
    let curr = currentFolder;
    while (curr && curr.id !== 'root') {
      crumbs.unshift({ id: curr.id, name: curr.name });
      curr = files.find(f => f.id === curr!.parentId);
    }
    crumbs.unshift({ id: 'root', name: '/' });
    return crumbs;
  };

  return (
    <div id="filesystem-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100 flex flex-col">
      
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">Virtual File System (VFS)</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Explore inode streams, read configuration records, and test file/folder CRUD operations.</p>
        </div>
        <button
          id="add-vfs-item-btn"
          onClick={() => {
            setCreateType('file');
            setCreateName('');
            setCreateError('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white transition-all shadow-md shadow-violet-600/10"
        >
          <Plus size={14} />
          <span>NEW FS NODE</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-[450px]">
        
        {/* Main Explorer Frame */}
        <div className="lg:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-full overflow-hidden">
          
          {/* Breadcrumb & Navigation row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3.5 mb-3 shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              {currentFolderId !== 'root' && (
                <button
                  id="vfs-parent-folder-btn"
                  onClick={() => {
                    const parent = files.find(f => f.id === currentFolderId);
                    if (parent && parent.parentId) {
                      setCurrentFolderId(parent.parentId);
                    } else {
                      setCurrentFolderId('root');
                    }
                  }}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                >
                  <ArrowLeft size={13} />
                </button>
              )}
              
              {/* Path sequence breadcrumbs */}
              <div className="flex items-center gap-1 flex-wrap">
                <HardDrive size={13} className="text-violet-400" />
                {getBreadcrumbs().map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    <button
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className="hover:text-violet-400 hover:underline cursor-pointer"
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-48 font-sans">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input
                id="vfs-search-input"
                type="text"
                placeholder="Search folder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-8.5 pr-3 py-1.5 text-[11px] text-white placeholder-slate-600 font-mono transition-all"
              />
            </div>
          </div>

          {/* Directory Items Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1.5">
              
              {/* Double dot parent folder shortcut */}
              {currentFolderId !== 'root' && (
                <div
                  id="vfs-up-dot"
                  onDoubleClick={() => {
                    const parent = files.find(f => f.id === currentFolderId);
                    setCurrentFolderId(parent?.parentId || 'root');
                  }}
                  className="p-3.5 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/10 text-slate-600 flex items-center gap-3 cursor-pointer select-none font-mono text-xs hover:border-slate-700 hover:bg-slate-900/10 transition-all duration-200"
                >
                  <FolderOpen size={16} />
                  <span>.. [Up Folder]</span>
                </div>
              )}

              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  id={`vfs-item-${item.id}`}
                  onDoubleClick={() => {
                    if (item.type === 'directory') {
                      setCurrentFolderId(item.id);
                    } else {
                      setSelectedFile(item);
                      setEditorContent(item.content || '');
                      setIsEditingContent(false);
                    }
                  }}
                  onClick={() => {
                    setSelectedFile(item);
                    setEditorContent(item.content || '');
                    setIsEditingContent(false);
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between h-28 font-mono text-xs relative group select-none cursor-pointer transition-all duration-200 ${
                    selectedFile?.id === item.id
                      ? 'bg-violet-600/10 border-violet-500/55 text-slate-200 shadow-inner'
                      : 'bg-slate-900/35 border-slate-800/80 hover:border-slate-700/80 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    {item.type === 'directory' ? (
                      <Folder size={20} className="text-amber-400 group-hover:scale-105 transition-transform" />
                    ) : (
                      <FileText size={20} className="text-cyan-400 group-hover:scale-105 transition-transform" />
                    )}
                    
                    {/* Action indicators */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5">
                      {item.type === 'file' && (
                        <button
                          id={`vfs-copy-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyFile(item.id);
                          }}
                          title="Copy file stream"
                          className="p-1 rounded bg-slate-950/80 text-slate-500 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800"
                        >
                          <Copy size={11} />
                        </button>
                      )}
                      <button
                        id={`vfs-rename-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameFileId(item.id);
                          setRenameName(item.name);
                        }}
                        title="Rename file link"
                        className="p-1 rounded bg-slate-950/80 text-slate-500 hover:text-violet-300 hover:bg-slate-900 border border-slate-800"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        id={`vfs-delete-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(item.id);
                        }}
                        title="Delete inode link"
                        className="p-1 rounded bg-slate-950/80 text-slate-500 hover:text-red-400 hover:bg-slate-900 border border-slate-800"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {renameFileId === item.id ? (
                    <div className="mt-1 flex items-center gap-1 font-sans">
                      <input
                        type="text"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameNode(item.id);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="mt-2 font-bold text-slate-200 truncate pr-2 leading-snug">
                      {item.name}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 flex justify-between mt-0.5">
                    <span>{item.type === 'directory' ? 'Folder' : `${item.size} bytes`}</span>
                    <span>{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notepad / Inspector pane */}
        <div className="glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-full overflow-hidden">
          <div className="border-b border-slate-800 pb-3 mb-3 shrink-0 flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <FileText size={18} className="text-violet-400" />
              <span>Notepad Editor</span>
            </h3>
            {selectedFile && selectedFile.type === 'file' && (
              <button
                id="vfs-edit-toggle-btn"
                onClick={() => setIsEditingContent(!isEditingContent)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-slate-300"
              >
                {isEditingContent ? 'CANCEL' : 'EDIT'}
              </button>
            )}
          </div>

          {selectedFile ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="space-y-1.5 shrink-0 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between"><span>File Name:</span><span className="text-slate-200 font-bold">{selectedFile.name}</span></div>
                <div className="flex justify-between"><span>Inode Size:</span><span className="text-slate-200">{selectedFile.size} Bytes</span></div>
                <div className="flex justify-between"><span>Creation Epoch:</span><span className="text-slate-500 text-[10px]">{new Date(selectedFile.createdAt).toLocaleString()}</span></div>
              </div>

              {selectedFile.type === 'file' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {isEditingContent ? (
                    <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                      <textarea
                        id="vfs-notepad-textarea"
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-violet-500 resize-none"
                      />
                      <button
                        id="vfs-notepad-save-btn"
                        onClick={handleSaveFileContent}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Save size={13} />
                        <span>SAVE STREAM TO DISK</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 bg-slate-950/40 border border-slate-900 rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
                      {selectedFile.content || '(File stream is empty)'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-slate-500 font-mono text-xs text-center border border-dashed border-slate-900 rounded-xl p-4">
                  <FolderOpen size={36} className="text-slate-600 animate-pulse mb-3" />
                  <span>'{selectedFile.name}' is a directory descriptor. Double-click to traverse inside its records.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-500 font-mono text-xs text-center border border-dashed border-slate-900 rounded-xl p-4">
              <Folder size={36} className="text-slate-700 mb-3" />
              <span>Select an item in the directory to inspect metadata values or write binary notes.</span>
            </div>
          )}

        </div>

      </div>

      {/* CREATE FILE/FOLDER MODAL */}
      {showCreateModal && (
        <div id="vfs-create-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-2">
              Create Virtual File Node
            </h3>

            <form onSubmit={handleCreateNode} className="space-y-4 font-sans text-xs">
              {createError && (
                <div className="p-2 bg-red-950/20 border border-red-900 text-red-400 rounded text-[10px] font-mono">
                  {createError}
                </div>
              )}

              <div className="flex gap-4 font-mono">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="createType"
                    checked={createType === 'file'}
                    onChange={() => setCreateType('file')}
                    className="accent-violet-500"
                  />
                  <span>Text File (.txt)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="createType"
                    checked={createType === 'directory'}
                    onChange={() => setCreateType('directory')}
                    className="accent-violet-500"
                  />
                  <span>Directory</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 font-bold">Node Name</label>
                <input
                  id="vfs-modal-name-input"
                  type="text"
                  placeholder={createType === 'file' ? 'log.txt' : 'documents'}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div className="flex gap-2.5 font-mono pt-2">
                <button
                  id="vfs-modal-cancel"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-center"
                >
                  CANCEL
                </button>
                <button
                  id="vfs-modal-submit"
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all text-center"
                >
                  CREATE INODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

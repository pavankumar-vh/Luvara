import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Bookmark, Trash2, Loader2, FlaskConical, TrendingUp, FolderPlus, Edit3, Check, X,
  Search, ArrowUpDown, ChevronDown, Download, GitCompare, MoreHorizontal, Star, StickyNote, Filter,
  FolderOpen, Layers, FileText, Sparkles, Hash
} from 'lucide-react';
import { clsx } from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

interface SavedItem { id: string; molecule: string; indication: string; score: number; createdAt: string; }

type SortKey = 'newest' | 'oldest' | 'score_high' | 'score_low' | 'name';
const TOAST_STYLE = { background: '#18181b', color: '#fff', border: '1px solid #27272a' };

export default function CollectionsPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('collection_folders') || '[]'); } catch { return []; }
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 10]);
  const [showScoreFilter, setShowScoreFilter] = useState(false);
  const navigate = useNavigate();

  // Notes stored in localStorage
  const getNotes = () => { try { return JSON.parse(localStorage.getItem('collection_notes') || '{}'); } catch { return {}; } };
  const getFolderMap = () => { try { return JSON.parse(localStorage.getItem('collection_folder_map') || '{}'); } catch { return {}; } };

  useEffect(() => {
    fetch('/api/collections', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveFolders = (f: string[]) => { setFolders(f); localStorage.setItem('collection_folders', JSON.stringify(f)); };
  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) return;
    saveFolders([...folders, name]);
    setNewFolderName(''); setAddingFolder(false);
    toast.success(`Created folder "${name}"`, { style: TOAST_STYLE });
  };
  const handleDeleteFolder = (f: string) => {
    saveFolders(folders.filter(x => x !== f));
    const map = getFolderMap(); Object.keys(map).forEach(k => { if (map[k] === f) delete map[k]; }); localStorage.setItem('collection_folder_map', JSON.stringify(map));
    if (activeFolder === f) setActiveFolder(null);
  };
  const moveToFolder = (itemId: string, folder: string | null) => {
    const map = getFolderMap();
    if (folder) map[itemId] = folder; else delete map[itemId];
    localStorage.setItem('collection_folder_map', JSON.stringify(map));
    toast.success(folder ? `Moved to ${folder}` : 'Removed from folder', { style: TOAST_STYLE, duration: 1500 });
  };
  const saveNote = (itemId: string) => {
    const notes = getNotes(); notes[itemId] = noteText; localStorage.setItem('collection_notes', JSON.stringify(notes));
    setEditingNote(null); setNoteText('');
    toast.success('Note saved', { style: TOAST_STYLE, duration: 1500 });
  };

  const toggleSelect = (id: string) => { const next = new Set(selectedItems); if (next.has(id)) next.delete(id); else next.add(id); setSelectedItems(next); };
  const selectAll = () => setSelectedItems(new Set(filteredItems.map(i => i.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const handleBulkRemove = async () => {
    for (const id of selectedItems) {
      try { await fetch(`/api/collections/${id}/bookmark`, { method: 'POST', credentials: 'include' }); } catch {}
    }
    setItems(items.filter(i => !selectedItems.has(i.id)));
    setSelectedItems(new Set());
    toast.success(`Removed ${selectedItems.size} items`, { style: TOAST_STYLE });
  };

  const filteredItems = useMemo(() => {
    const notes = getNotes();
    const folderMap = getFolderMap();
    let list = items;
    if (activeFolder) list = list.filter(i => folderMap[i.id] === activeFolder);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.molecule.toLowerCase().includes(q) || i.indication.toLowerCase().includes(q) || (notes[i.id] || '').toLowerCase().includes(q));
    }
    list = list.filter(i => i.score >= scoreRange[0] && i.score <= scoreRange[1]);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'score_high': return b.score - a.score;
        case 'score_low': return a.score - b.score;
        case 'name': return a.molecule.localeCompare(b.molecule);
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [items, searchQuery, sortBy, activeFolder, scoreRange]);

  const stats = useMemo(() => ({
    total: items.length,
    avgScore: items.length ? (items.reduce((s, i) => s + i.score, 0) / items.length).toFixed(1) : '0',
    highViability: items.filter(i => i.score >= 7).length,
    notesCount: Object.keys(getNotes()).length,
  }), [items]);

  const handleExport = () => {
    const notes = getNotes();
    const data = filteredItems.map(i => ({ ...i, note: notes[i.id] || '' }));
    const blob = new Blob([JSON.stringify({ collection: data, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collections.json'; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported collection', { style: TOAST_STYLE });
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Toaster position="bottom-right" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><Bookmark className="text-emerald-400" size={20} /></div>
                Research Collections
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Organize, annotate, and manage your bookmarked molecules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && (
              <button onClick={handleBulkRemove} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 hover:bg-red-500/20 transition-all">
                <Trash2 size={14} /> Remove ({selectedItems.size})
              </button>
            )}
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            {/* Folders */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5"><FolderOpen size={12} /> Folders</h3>
              <div className="space-y-1">
                <button onClick={() => setActiveFolder(null)} className={clsx("w-full text-left px-3 py-2 rounded-lg text-xs transition-all", !activeFolder ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40')}>
                  All Items <span className="text-zinc-600 ml-1">({items.length})</span>
                </button>
                {folders.map(f => (
                  <div key={f} className="flex items-center group">
                    <button onClick={() => setActiveFolder(activeFolder === f ? null : f)} className={clsx("flex-1 text-left px-3 py-2 rounded-lg text-xs transition-all", activeFolder === f ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40')}>
                      {f}
                    </button>
                    <button onClick={() => handleDeleteFolder(f)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"><X size={12} /></button>
                  </div>
                ))}
                {addingFolder ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setAddingFolder(false); }}
                      placeholder="Folder name" autoFocus className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30" />
                    <button onClick={handleAddFolder} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"><Check size={14} /></button>
                    <button onClick={() => setAddingFolder(false)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddingFolder(true)} className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-emerald-400 transition-all rounded-lg hover:bg-zinc-800/40">
                    <FolderPlus size={12} /> New Folder
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 space-y-3">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Layers size={12} /> Stats</h3>
              {[
                { label: 'Total Saved', value: stats.total, color: 'text-white' },
                { label: 'Avg Score', value: stats.avgScore, color: 'text-cyan-400' },
                { label: 'High Viability', value: stats.highViability, color: 'text-emerald-400' },
                { label: 'Notes Added', value: stats.notesCount, color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search molecules, indications, notes..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3.5 py-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-[10px] text-zinc-400 uppercase tracking-wider font-semibold hover:text-zinc-200 transition-all">
                    <ArrowUpDown size={12} /> {sortBy.replace('_', ' ')} <ChevronDown size={10} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden z-30 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {(['newest', 'oldest', 'score_high', 'score_low', 'name'] as SortKey[]).map(key => (
                      <button key={key} onClick={() => setSortBy(key)} className={clsx("w-full text-left px-4 py-2.5 text-xs transition-colors", sortBy === key ? 'text-emerald-400 bg-emerald-500/5' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200')}>
                        {key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowScoreFilter(!showScoreFilter)} className={clsx("p-3 rounded-xl border transition-all", showScoreFilter ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200')}>
                  <Filter size={14} />
                </button>
                {filteredItems.length > 0 && (
                  <button onClick={selectedItems.size === filteredItems.length ? clearSelection : selectAll} className="px-3 py-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold hover:text-zinc-200 transition-all">
                    {selectedItems.size === filteredItems.length ? 'Deselect' : 'Select All'}
                  </button>
                )}
              </div>
            </div>

            {showScoreFilter && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Score Range</span>
                  <span className="text-xs text-zinc-400 font-mono">{scoreRange[0]} – {scoreRange[1]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={10} step={0.5} value={scoreRange[0]} onChange={e => setScoreRange([+e.target.value, scoreRange[1]])} className="flex-1 accent-emerald-500" />
                  <input type="range" min={0} max={10} step={0.5} value={scoreRange[1]} onChange={e => setScoreRange([scoreRange[0], +e.target.value])} className="flex-1 accent-emerald-500" />
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
              </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
              <div className="text-center py-24">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center">
                  <Bookmark size={32} className="text-zinc-600" />
                </div>
                <p className="text-lg font-semibold text-zinc-400 mb-2">No saved molecules yet</p>
                <p className="text-sm text-zinc-600 mb-6">Bookmark molecules from your reports to start building your collection.</p>
                <button onClick={() => navigate('/search')} className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-2 mx-auto">
                  <Search size={14} /> Start Searching
                </button>
              </div>
            )}

            {/* Items */}
            {!loading && filteredItems.length > 0 && (
              <div className="space-y-2">
                {filteredItems.map((item, i) => {
                  const notes = getNotes();
                  const note = notes[item.id] || '';
                  const folderMap = getFolderMap();
                  const itemFolder = folderMap[item.id] || null;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={clsx("p-4 rounded-2xl border transition-all group", selectedItems.has(item.id) ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/40')}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleSelect(item.id)} className={clsx("mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          selectedItems.has(item.id) ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700 hover:border-zinc-500')}>
                          {selectedItems.has(item.id) && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors truncate">{item.molecule}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-zinc-500">{item.indication}</span>
                                {itemFolder && <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">{itemFolder}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={clsx("font-mono font-bold text-lg", item.score >= 8 ? 'text-emerald-400' : item.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{item.score.toFixed(1)}</span>
                              <p className="text-[9px] text-zinc-600 uppercase">Score</p>
                            </div>
                          </div>
                          {/* Score bar */}
                          <div className="h-1 bg-zinc-800/40 rounded-full mb-2 overflow-hidden">
                            <div className={clsx("h-full rounded-full transition-all", item.score >= 8 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : item.score >= 5 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-amber-600 to-amber-400')}
                              style={{ width: `${(item.score / 10) * 100}%` }} />
                          </div>
                          {/* Note */}
                          {editingNote === item.id ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveNote(item.id); }} autoFocus
                                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30" placeholder="Add a note..." />
                              <button onClick={() => saveNote(item.id)} className="p-1 text-emerald-400"><Check size={14} /></button>
                              <button onClick={() => setEditingNote(null)} className="p-1 text-zinc-500"><X size={14} /></button>
                            </div>
                          ) : note ? (
                            <button onClick={() => { setEditingNote(item.id); setNoteText(note); }} className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                              <StickyNote size={10} /> {note}
                            </button>
                          ) : null}
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/report/${item.id}`} className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1 font-medium">
                              <FileText size={10} /> View Report
                            </Link>
                            <button onClick={() => { setEditingNote(item.id); setNoteText(note); }}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800/40 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200 transition-all flex items-center gap-1 font-medium">
                              <Edit3 size={10} /> {note ? 'Edit Note' : 'Add Note'}
                            </button>
                            {folders.length > 0 && (
                              <div className="relative group/folder">
                                <button className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800/40 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200 transition-all flex items-center gap-1 font-medium">
                                  <FolderOpen size={10} /> Move
                                </button>
                                <div className="absolute left-0 bottom-full mb-1 w-32 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden z-30 shadow-2xl opacity-0 invisible group-hover/folder:opacity-100 group-hover/folder:visible transition-all">
                                  {folders.map(f => (
                                    <button key={f} onClick={() => moveToFolder(item.id, f)} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">{f}</button>
                                  ))}
                                  {itemFolder && <button onClick={() => moveToFolder(item.id, null)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors border-t border-zinc-800/40">Remove from folder</button>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!loading && items.length > 0 && filteredItems.length === 0 && (
              <div className="text-center py-16">
                <Search size={32} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400 text-sm mb-2">No items match your filters</p>
                <button onClick={() => { setSearchQuery(''); setActiveFolder(null); setScoreRange([0, 10]); }} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

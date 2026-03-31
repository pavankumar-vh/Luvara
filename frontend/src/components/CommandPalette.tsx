import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, GitCompare, Users, User, Atom, ArrowRight,
  FlaskConical, LayoutGrid, Command, Dna, Zap, Bookmark, Globe,
  Moon, Sun, Monitor, Hash
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
  shortcut?: string;
  keywords?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent history
  useEffect(() => {
    fetch('/api/history', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentReports(data.filter((j: any) => j.status === 'completed').slice(0, 5));
        }
      })
      .catch(() => {});
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Fuzzy highlight helper
  const highlightMatch = useCallback((text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-cyan-400 font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const current = root.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    root.classList.remove(current);
    root.classList.add(next);
    localStorage.setItem('vite-ui-theme', next);
    close();
  }, [close]);

  const staticItems: PaletteItem[] = [
    { id: 'search', label: 'New Analysis', sublabel: 'Search for a molecule', icon: <Search size={16} />, action: () => { close(); navigate('/search'); }, section: 'Navigation', shortcut: '⌘S', keywords: 'search analyze drug molecule' },
    { id: 'portfolio', label: 'Portfolio', sublabel: 'View all your analyses', icon: <LayoutGrid size={16} />, action: () => { close(); navigate('/portfolio'); }, section: 'Navigation', shortcut: '⌘P', keywords: 'portfolio history reports' },
    { id: 'compare', label: 'Compare Molecules', sublabel: 'Head-to-head comparison', icon: <GitCompare size={16} />, action: () => { close(); navigate('/compare'); }, section: 'Navigation', keywords: 'compare side by side' },
    { id: 'community', label: 'Community', sublabel: 'View discussions', icon: <Users size={16} />, action: () => { close(); navigate('/community'); }, section: 'Navigation', keywords: 'community forum discuss' },
    { id: 'profile', label: 'Profile & Settings', sublabel: 'Account settings', icon: <User size={16} />, action: () => { close(); navigate('/profile'); }, section: 'Navigation', keywords: 'profile settings account' },
    { id: 'biomarker', label: 'Biomarker Pipeline', sublabel: 'Gene → Drug reverse search', icon: <Dna size={16} />, action: () => { close(); navigate('/biomarker'); }, section: 'Tools', keywords: 'biomarker gene target drug pipeline' },
    { id: 'interactions', label: 'Interaction Checker', sublabel: 'Multi-drug interaction matrix', icon: <Zap size={16} />, action: () => { close(); navigate('/interactions'); }, section: 'Tools', keywords: 'interaction drug safety check' },
    { id: 'collections', label: 'Saved Collections', sublabel: 'Bookmarked reports & folders', icon: <Bookmark size={16} />, action: () => { close(); navigate('/collections'); }, section: 'Tools', keywords: 'collection bookmark saved watchlist' },
    { id: 'gallery', label: 'Public Gallery', sublabel: 'Community shared reports', icon: <Globe size={16} />, action: () => { close(); navigate('/gallery'); }, section: 'Discovery', keywords: 'gallery public shared explore' },
    { id: 'theme', label: 'Toggle Theme', sublabel: 'Switch dark/light mode', icon: <Moon size={16} />, action: toggleTheme, section: 'Actions', keywords: 'theme dark light mode toggle' },
  ];

  const reportItems: PaletteItem[] = recentReports.map(r => ({
    id: `report-${r._id}`,
    label: r.molecule,
    sublabel: `Phoenix: ${(r.reportData?.phoenix_score ?? r.reportData?.ai_analysis?.viability_score ?? '—')} · ${new Date(r.createdAt).toLocaleDateString()}`,
    icon: <Atom size={16} />,
    action: () => { close(); navigate(`/report/${r._id}`); },
    section: 'Recent Reports',
  }));

  const allItems = [...staticItems, ...reportItems];

  const filtered = query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q) ||
          (item.sublabel || '').toLowerCase().includes(q) ||
          (item.keywords || '').toLowerCase().includes(q);
      })
    : allItems;

  // Group by section
  const sections = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={close}
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[560px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 z-[201] overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/60">
              <Search size={18} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 text-sm outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-500 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                Object.entries(sections).map(([section, items]) => (
                  <div key={section}>
                    <div className="px-5 pt-3 pb-1.5">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{section}</span>
                    </div>
                    {items.map(item => {
                      const idx = flatIndex++;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                            selectedIndex === idx
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <span className={selectedIndex === idx ? 'text-cyan-400' : 'text-zinc-500'}>{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{highlightMatch(item.label, query)}</p>
                            {item.sublabel && <p className="text-[11px] text-zinc-500 truncate">{item.sublabel}</p>}
                          </div>
                          {item.shortcut && (
                            <kbd className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                              selectedIndex === idx ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                            }`}>{item.shortcut}</kbd>
                          )}
                          <ArrowRight size={12} className={`shrink-0 ${selectedIndex === idx ? 'text-cyan-500' : 'text-zinc-700'}`} />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
              {flatIndex = 0 as any}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center gap-4 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono">↵</kbd> Open</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono">Esc</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

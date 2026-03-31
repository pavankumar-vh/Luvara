import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Dna, Pill, TrendingUp, Loader2, AlertCircle, ExternalLink,
  Download, BarChart3, Network, ChevronDown, X, Activity, Microscope, FlaskConical,
  Sparkles, Target, Copy, CheckCircle, Hash, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

interface DrugHit {
  drug_name: string;
  mechanism: string;
  max_phase: number;
  disease: string;
  score: number;
}

type ViewMode = 'table' | 'cards' | 'chart';
type SortKey = 'score' | 'phase' | 'name';

const POPULAR_GENES = ['EGFR', 'BRCA1', 'TP53', 'BRAF', 'HER2', 'KRAS', 'ALK', 'PIK3CA', 'PTEN', 'MYC', 'RB1', 'VEGFA', 'FGFR2', 'CDK4', 'IDH1', 'NTRK1', 'RET', 'MET'];

const TOAST_STYLE = { background: '#18181b', color: '#fff', border: '1px solid #27272a' };

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
);

const StatCard = ({ label, value, color, icon: Icon, subtitle }: { label: string; value: string | number; color: string; icon: any; subtitle?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 overflow-hidden group hover:border-zinc-700/60 transition-all duration-300"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${color.replace('text-', 'bg-')} pointer-events-none group-hover:opacity-30 transition-opacity`} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">{label}</p>
        <p className={`text-3xl font-bold ${color} tracking-tight`}>{value}</p>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/30 ${color}`}>
        <Icon size={16} />
      </div>
    </div>
  </motion.div>
);

export default function BiomarkerPage() {
  const [gene, setGene] = useState('');
  const [results, setResults] = useState<DrugHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('biomarker_history') || '[]'); } catch { return []; }
  });
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [filterPhase, setFilterPhase] = useState<number | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<DrugHit | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedDrug, setCopiedDrug] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') { setSelectedDrug(null); setShowSuggestions(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = useCallback(async (searchGene?: string) => {
    const q = (searchGene || gene).trim().toUpperCase();
    if (!q) return;
    setGene(q);
    setLoading(true);
    setError(null);
    setSearched(true);
    setSelectedDrug(null);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/biomarker-search?gene=${encodeURIComponent(q)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.drugs || []);
      const newHistory = [q, ...searchHistory.filter(g => g !== q)].slice(0, 12);
      setSearchHistory(newHistory);
      localStorage.setItem('biomarker_history', JSON.stringify(newHistory));
      if (data.drugs?.length) {
        toast.success(`Found ${data.drugs.length} drugs targeting ${q}`, { style: TOAST_STYLE });
      }
    } catch {
      setError('Failed to fetch biomarker data. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [gene, searchHistory]);

  const suggestions = useMemo(() => {
    if (!gene.trim()) return POPULAR_GENES;
    return POPULAR_GENES.filter(g => g.includes(gene.trim().toUpperCase()));
  }, [gene]);

  const sortedResults = useMemo(() => {
    const filtered = filterPhase !== null ? results.filter(r => r.max_phase === filterPhase) : results;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'phase') return b.max_phase - a.max_phase;
      return a.drug_name.localeCompare(b.drug_name);
    });
  }, [results, sortBy, filterPhase]);

  const phaseStats = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    results.forEach(r => { counts[r.max_phase as keyof typeof counts] = (counts[r.max_phase as keyof typeof counts] || 0) + 1; });
    return counts;
  }, [results]);

  const avgScore = useMemo(() => results.length === 0 ? 0 : results.reduce((s, r) => s + r.score, 0) / results.length, [results]);
  const topScore = useMemo(() => results.length ? Math.max(...results.map(r => r.score)) : 0, [results]);

  const mechanismGroups = useMemo(() => {
    const map = new Map<string, DrugHit[]>();
    results.forEach(r => {
      const key = r.mechanism || 'Unknown mechanism';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [results]);

  const handleExport = (type: 'csv' | 'json') => {
    if (type === 'csv') {
      const header = 'Drug Name,Mechanism,Max Phase,Disease,Score\n';
      const rows = sortedResults.map(r => `"${r.drug_name}","${r.mechanism}",${r.max_phase},"${r.disease}",${r.score}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `biomarker_${gene}_drugs.csv`; a.click(); URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify({ gene: gene.toUpperCase(), drugs: sortedResults, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `biomarker_${gene}_drugs.json`; a.click(); URL.revokeObjectURL(url);
    }
    toast.success(`Exported ${sortedResults.length} drugs as ${type.toUpperCase()}`, { style: TOAST_STYLE });
  };

  const copyDrug = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedDrug(name);
    setTimeout(() => setCopiedDrug(null), 2000);
  };

  const phaseLabel = (p: number) => p >= 4 ? 'Approved' : p >= 3 ? 'Phase III' : p >= 2 ? 'Phase II' : p >= 1 ? 'Phase I' : 'Preclinical';
  const phaseColor = (p: number) => p >= 4 ? 'text-emerald-400' : p >= 3 ? 'text-cyan-400' : p >= 2 ? 'text-amber-400' : p >= 1 ? 'text-orange-400' : 'text-zinc-400';
  const phaseBg = (p: number) => p >= 4 ? 'bg-emerald-500/10 border-emerald-500/20' : p >= 3 ? 'bg-cyan-500/10 border-cyan-500/20' : p >= 2 ? 'bg-amber-500/10 border-amber-500/20' : p >= 1 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-zinc-800/40 border-zinc-700/40';
  const phaseBarColors = ['bg-zinc-600', 'bg-orange-500', 'bg-amber-500', 'bg-cyan-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Toaster position="bottom-right" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Dna className="text-cyan-400" size={20} />
                </div>
                Biomarker → Drug Pipeline
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                Reverse drug discovery — gene targets to therapeutic candidates
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-[9px] text-zinc-500 font-mono">/</kbd>
              </p>
            </div>
          </div>
          {results.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all">
                <Download size={14} /> Export <ChevronDown size={11} />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden z-30 shadow-2xl shadow-black/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors flex items-center gap-2">
                  <BarChart3 size={12} /> Export as CSV
                </button>
                <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors border-t border-zinc-800/40 flex items-center gap-2">
                  <Layers size={12} /> Export as JSON
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                ref={inputRef}
                value={gene}
                onChange={e => { setGene(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSuggestions(false); }}
                placeholder="Enter gene symbol — BRCA1, TP53, EGFR, HER2, KRAS..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all text-sm"
              />
              {gene && (
                <button onClick={() => { setGene(''); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/60 transition-all">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !gene.trim()}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 text-sm shrink-0 shadow-lg shadow-cyan-500/10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </div>

          <AnimatePresence>
            {showSuggestions && !loading && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="absolute left-0 right-0 top-full mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl overflow-hidden z-30 shadow-2xl shadow-black/60"
              >
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Target size={10} /> {gene.trim() ? 'Matching Genes' : 'Popular Targets'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 px-2 pb-2">
                  {suggestions.slice(0, 12).map(g => (
                    <button key={g} onClick={() => { setGene(g); handleSearch(g); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-left hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-400 transition-all rounded-xl text-sm group">
                      <Dna size={12} className="text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                      <span className="font-mono font-medium text-xs">{g}</span>
                    </button>
                  ))}
                </div>
                {searchHistory.length > 0 && (
                  <>
                    <div className="px-4 pt-2 pb-1.5 border-t border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Activity size={10} /> Recent</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                      {searchHistory.slice(0, 6).map(g => (
                        <button key={`h-${g}`} onClick={() => { setGene(g); handleSearch(g); }}
                          className="px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-[11px] font-mono">{g}</button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 mb-6">
            <AlertCircle size={18} /> <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40"><Skeleton className="h-3 w-16 mb-3" /><Skeleton className="h-8 w-20 mb-1" /><Skeleton className="h-2 w-12 mt-2" /></div>
              ))}
            </div>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40">
                  <div className="flex items-center gap-3 mb-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-20" /></div></div>
                  <Skeleton className="h-1.5 w-full rounded-full mb-3" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-500 text-sm animate-pulse">Querying Open Targets for <span className="text-cyan-400 font-mono">{gene.trim().toUpperCase()}</span>...</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {!loading && searched && results.length === 0 && !error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center"><Dna size={32} className="text-zinc-600" /></div>
              <p className="text-lg font-semibold text-zinc-400 mb-2">No drugs found for "{gene.trim().toUpperCase()}"</p>
              <p className="text-sm text-zinc-600 mb-6">Try a different gene symbol or check the spelling.</p>
              <button onClick={() => { setGene(''); setSearched(false); inputRef.current?.focus(); }} className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-sm text-zinc-400 hover:text-zinc-200 transition-all">Try another search</button>
            </motion.div>
          )}

          {!loading && results.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Drugs" value={results.length} color="text-white" icon={Pill} subtitle={`targeting ${gene.toUpperCase()}`} />
                <StatCard label="Approved" value={phaseStats[4]} color="text-emerald-400" icon={CheckCircle} subtitle={phaseStats[4] > 0 ? `${((phaseStats[4]/results.length)*100).toFixed(0)}% of pipeline` : 'None yet'} />
                <StatCard label="Avg Score" value={avgScore.toFixed(1)} color="text-cyan-400" icon={TrendingUp} subtitle={`Top: ${topScore.toFixed(1)}`} />
                <StatCard label="Mechanisms" value={mechanismGroups.length} color="text-amber-400" icon={Network} subtitle={mechanismGroups[0]?.[0]?.slice(0, 25) || ''} />
              </div>

              {/* Phase Distribution */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={14} className="text-zinc-500" /> Clinical Phase Distribution</h3>
                  <span className="text-xs text-zinc-600 font-mono bg-zinc-800/40 px-2 py-0.5 rounded">{gene.trim().toUpperCase()}</span>
                </div>
                <div className="flex gap-1.5 h-10 rounded-xl overflow-hidden mb-4">
                  {[0,1,2,3,4].map(phase => {
                    const count = phaseStats[phase as keyof typeof phaseStats];
                    const pct = results.length ? (count / results.length) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <motion.div key={phase} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: phase * 0.1, ease: [0.25,0.46,0.45,0.94] }}
                        className={clsx(phaseBarColors[phase], 'flex items-center justify-center cursor-pointer hover:brightness-125 transition-all rounded-lg', filterPhase === phase && 'ring-2 ring-white/30')}
                        onClick={() => setFilterPhase(filterPhase === phase ? null : phase)} title={`${phaseLabel(phase)}: ${count} drugs`}>
                        {pct > 10 && <span className="text-[11px] font-bold text-white/90">{count} <span className="text-white/50 text-[9px]">{phaseLabel(phase)}</span></span>}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[0,1,2,3,4].map(phase => {
                    const count = phaseStats[phase as keyof typeof phaseStats];
                    if (count === 0) return null;
                    return (
                      <button key={phase} onClick={() => setFilterPhase(filterPhase === phase ? null : phase)}
                        className={clsx("flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full border transition-all",
                          filterPhase === phase ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-sm shadow-cyan-500/10' : 'border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700')}>
                        <div className={`w-2 h-2 rounded-full ${phaseBarColors[phase]}`} />{phaseLabel(phase)} <span className="text-zinc-600">({count})</span>
                      </button>
                    );
                  })}
                  {filterPhase !== null && (
                    <button onClick={() => setFilterPhase(null)} className="text-[11px] text-zinc-500 hover:text-zinc-300 px-3 py-1.5 flex items-center gap-1 rounded-full border border-zinc-800/60 hover:border-zinc-700 transition-all"><X size={10} /> Clear</button>
                  )}
                </div>
              </motion.div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-semibold">{sortedResults.length}</span> drug{sortedResults.length !== 1 ? 's' : ''}
                  {filterPhase !== null && <span className="text-cyan-400"> · {phaseLabel(filterPhase)}</span>}
                  {' '}for <span className="text-cyan-400 font-mono font-semibold">{gene.trim().toUpperCase()}</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-900/40 border border-zinc-800/40 rounded-xl overflow-hidden">
                    {(['cards','table','chart'] as ViewMode[]).map(mode => (
                      <button key={mode} onClick={() => setViewMode(mode)} className={clsx("px-3.5 py-2 text-[10px] uppercase tracking-wider font-semibold transition-all", viewMode === mode ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}>{mode}</button>
                    ))}
                  </div>
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900/40 border border-zinc-800/40 rounded-xl text-[10px] text-zinc-400 uppercase tracking-wider font-semibold hover:text-zinc-200 transition-all">Sort: {sortBy} <ChevronDown size={10} /></button>
                    <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden z-30 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      {(['score','phase','name'] as SortKey[]).map(key => (
                        <button key={key} onClick={() => setSortBy(key)} className={clsx("w-full text-left px-4 py-2.5 text-xs transition-colors", sortBy === key ? 'text-cyan-400 bg-cyan-500/5' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200')}>{key.charAt(0).toUpperCase()+key.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {sortedResults.map((hit, i) => (
                    <motion.div key={hit.drug_name+i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i*0.03, 0.5) }}
                      onClick={() => setSelectedDrug(selectedDrug?.drug_name === hit.drug_name ? null : hit)}
                      className={clsx("p-5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden",
                        selectedDrug?.drug_name === hit.drug_name ? 'bg-cyan-500/5 border-cyan-500/30 shadow-lg shadow-cyan-500/5' : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/60')}>
                      {hit.score >= 8 && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />}
                      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl ${phaseBg(hit.max_phase)} border shrink-0`}><Pill size={16} className={phaseColor(hit.max_phase)} /></div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">{hit.drug_name}</h3>
                              <button onClick={e => { e.stopPropagation(); copyDrug(hit.drug_name); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-zinc-800/60" title="Copy">
                                {copiedDrug === hit.drug_name ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} className="text-zinc-500" />}
                              </button>
                            </div>
                            <span className={`text-[10px] font-semibold ${phaseColor(hit.max_phase)}`}>{phaseLabel(hit.max_phase)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={clsx("font-mono font-bold text-xl", hit.score >= 8 ? 'text-emerald-400' : hit.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{hit.score.toFixed(1)}</span>
                          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Score</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-800/40 rounded-full mb-3 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(hit.score/10)*100}%` }} transition={{ duration: 0.8, delay: Math.min(i*0.03, 0.5)+0.2, ease: [0.25,0.46,0.45,0.94] }}
                          className={clsx("h-full rounded-full", hit.score >= 8 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hit.score >= 5 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-amber-600 to-amber-400')} />
                      </div>
                      <p className="text-zinc-400 text-xs line-clamp-2 mb-2 leading-relaxed">{hit.mechanism || 'Mechanism not specified'}</p>
                      {hit.disease && <div className="flex items-center gap-1.5"><Microscope size={10} className="text-zinc-600 shrink-0" /><p className="text-zinc-500 text-[11px] truncate">{hit.disease}</p></div>}

                      <AnimatePresence>
                        {selectedDrug?.drug_name === hit.drug_name && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-4 pt-4 border-t border-zinc-800/40 space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/30"><p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Max Phase</p><p className={`text-sm font-semibold ${phaseColor(hit.max_phase)}`}>{phaseLabel(hit.max_phase)}</p></div>
                                <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/30"><p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Score</p><p className="text-sm font-semibold text-cyan-400">{hit.score.toFixed(2)} / 10</p></div>
                              </div>
                              {hit.disease && <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/30"><p className="text-[9px] text-zinc-600 uppercase mb-0.5">Primary Indication</p><p className="text-xs text-zinc-300">{hit.disease}</p></div>}
                              {hit.mechanism && <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/30"><p className="text-[9px] text-zinc-600 uppercase mb-0.5">Mechanism</p><p className="text-xs text-zinc-300">{hit.mechanism}</p></div>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-4 pt-3 border-t border-zinc-800/30 flex items-center gap-2">
                        <Link to="/search" state={{ prefill: hit.drug_name }} onClick={e => e.stopPropagation()} className="text-[10px] px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 font-medium"><FlaskConical size={11} /> Full Analysis</Link>
                        <a href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(hit.drug_name)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-zinc-800/40 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200 hover:border-zinc-600 transition-all flex items-center gap-1.5 font-medium"><ExternalLink size={11} /> PubChem</a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Table */}
              {viewMode === 'table' && (
                <div className="rounded-2xl border border-zinc-800/40 overflow-hidden bg-zinc-900/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-zinc-900/60 border-b border-zinc-800/40">
                        {['#','Drug','Mechanism','Phase','Indication','Score','Action'].map((h,i) => (
                          <th key={h} className={`${i >= 5 ? 'text-right' : 'text-left'} px-5 py-3.5 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold`}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {sortedResults.map((hit, i) => (
                          <motion.tr key={hit.drug_name+i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i*0.02, 0.3) }} className="border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors group">
                            <td className="px-5 py-3.5 text-zinc-600 font-mono text-xs">{i+1}</td>
                            <td className="px-5 py-3.5 font-medium text-zinc-200 group-hover:text-cyan-400 transition-colors">{hit.drug_name}</td>
                            <td className="px-5 py-3.5 text-zinc-400 text-xs max-w-[200px] truncate">{hit.mechanism||'—'}</td>
                            <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${phaseBg(hit.max_phase)} ${phaseColor(hit.max_phase)}`}>{phaseLabel(hit.max_phase)}</span></td>
                            <td className="px-5 py-3.5 text-zinc-400 text-xs max-w-[200px] truncate">{hit.disease||'—'}</td>
                            <td className="px-5 py-3.5 text-right"><span className={clsx("font-mono font-bold", hit.score >= 8 ? 'text-emerald-400' : hit.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{hit.score.toFixed(1)}</span></td>
                            <td className="px-5 py-3.5 text-right"><Link to="/search" state={{ prefill: hit.drug_name }} className="text-[10px] px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors font-medium">Analyze</Link></td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chart - Mechanism Groups */}
              {viewMode === 'chart' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-2"><Layers size={13} /> Grouped by Mechanism · {mechanismGroups.length} mechanisms</p>
                  {mechanismGroups.map(([mechanism, drugs], gi) => (
                    <motion.div key={mechanism} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi*0.05 }}
                      className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Hash size={13} className="text-cyan-500" />{mechanism}</h3>
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/40 px-2 py-0.5 rounded">{drugs.length} drug{drugs.length!==1?'s':''}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {drugs.sort((a,b) => b.score-a.score).map((drug, di) => (
                          <button key={drug.drug_name+di} onClick={() => setSelectedDrug(drug)}
                            className={clsx("px-3 py-2 rounded-xl text-xs border transition-all hover:scale-[1.02]",
                              drug.score >= 8 ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400' : drug.score >= 5 ? 'bg-cyan-500/8 border-cyan-500/20 text-cyan-400' : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400')}>
                            <span className="font-medium">{drug.drug_name}</span><span className="ml-2 font-mono text-[10px] opacity-60">{drug.score.toFixed(1)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-search */}
        {!searched && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Dna, title: 'Gene-First Discovery', desc: 'Enter any human gene symbol to discover all drugs that target it, from preclinical to approved.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                { icon: Target, title: 'Phase Intelligence', desc: 'See full clinical pipeline distribution — from preclinical compounds to FDA-approved therapeutics.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { icon: Sparkles, title: 'Cross-Reference', desc: 'One click to run a full Luvara analysis on any discovered drug, or deep-link to PubChem.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              ].map((card, i) => (
                <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3+i*0.1 }}
                  className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 transition-all group">
                  <div className={`p-2.5 rounded-xl ${card.bg} border inline-flex mb-4 group-hover:scale-110 transition-transform`}><card.icon size={18} className={card.color} /></div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">{card.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

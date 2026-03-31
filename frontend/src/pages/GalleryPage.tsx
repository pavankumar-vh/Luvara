import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Globe, TrendingUp, FlaskConical, Loader2, Clock, ChevronRight, Search,
  ArrowUpDown, ChevronDown, Heart, Eye, Filter, Star, X, LayoutGrid, List,
  Sparkles, ExternalLink, FileText, Hash, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

interface GalleryItem {
  id: string;
  molecule: string;
  indication: string;
  score: number;
  summary: string;
  createdAt: string;
  userName?: string;
}

type SortKey = 'newest' | 'oldest' | 'score_high' | 'score_low' | 'popular';
type ViewMode = 'grid' | 'list';
const TOAST_STYLE = { background: '#18181b', color: '#fff', border: '1px solid #27272a' };

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
);

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gallery_likes') || '[]')); } catch { return new Set(); }
  });
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/gallery', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = (id: string) => {
    const next = new Set(likedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setLikedIds(next);
    localStorage.setItem('gallery_likes', JSON.stringify([...next]));
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(i => { if (i.indication) i.indication.split(/[,;]/).map(c => c.trim()).filter(Boolean).forEach(c => cats.add(c)); });
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.molecule.toLowerCase().includes(q) || i.indication.toLowerCase().includes(q) || (i.summary || '').toLowerCase().includes(q));
    }
    if (selectedCategory) list = list.filter(i => i.indication.toLowerCase().includes(selectedCategory.toLowerCase()));
    if (scoreFilter) list = list.filter(i => i.score >= scoreFilter);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'score_high': return b.score - a.score;
        case 'score_low': return a.score - b.score;
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular': return (likedIds.has(b.id) ? 1 : 0) - (likedIds.has(a.id) ? 1 : 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [items, searchQuery, sortBy, selectedCategory, scoreFilter, likedIds]);

  const featuredItems = useMemo(() => [...items].sort((a, b) => b.score - a.score).slice(0, 3), [items]);
  const hasActiveFilters = searchQuery || selectedCategory || scoreFilter;

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Toaster position="bottom-right" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"><Globe className="text-rose-400" size={20} /></div>
                Public Report Gallery
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Explore community-shared drug repurposing analyses</p>
            </div>
          </div>
          {!loading && <p className="text-xs text-zinc-500 font-mono bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800/40">{items.length} public reports</p>}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40"><Skeleton className="h-4 w-32 mb-3" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-8 w-16 mt-3" /></div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40"><Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-1.5 w-full rounded-full mb-3" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-2/3" /></div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center"><Globe size={32} className="text-zinc-600" /></div>
            <p className="text-lg font-semibold text-zinc-400 mb-2">No public reports yet</p>
            <p className="text-sm text-zinc-600">Be the first to share your analysis!</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            {/* Featured */}
            {featuredItems.length > 0 && !hasActiveFilters && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Star size={14} className="text-amber-400" /> Top Scored Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {featuredItems.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="relative p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 transition-all group cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/report/${item.id}`)}>
                      {i === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />}
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">#1</span>}
                            <h3 className="font-semibold text-white text-sm truncate group-hover:text-rose-400 transition-colors">{item.molecule}</h3>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{item.indication}</p>
                        </div>
                        <span className={clsx("font-mono font-bold text-xl shrink-0", item.score >= 8 ? 'text-emerald-400' : item.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{item.score.toFixed(1)}</span>
                      </div>
                      <div className="h-1 bg-zinc-800/40 rounded-full overflow-hidden mb-3">
                        <div className={clsx("h-full rounded-full", item.score >= 8 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-cyan-400')} style={{ width: `${(item.score / 10) * 100}%` }} />
                      </div>
                      {item.summary && <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.summary}</p>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search molecules, indications, summaries..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 transition-all text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3.5 py-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-[10px] text-zinc-400 uppercase tracking-wider font-semibold hover:text-zinc-200 transition-all">
                    <ArrowUpDown size={12} /> {sortBy.replace('_', ' ')} <ChevronDown size={10} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden z-30 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {(['newest', 'oldest', 'score_high', 'score_low', 'popular'] as SortKey[]).map(key => (
                      <button key={key} onClick={() => setSortBy(key)} className={clsx("w-full text-left px-4 py-2.5 text-xs transition-colors", sortBy === key ? 'text-rose-400 bg-rose-500/5' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200')}>
                        {key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center bg-zinc-900/40 border border-zinc-800/40 rounded-xl overflow-hidden">
                  {([7, 5, 3] as number[]).map(min => (
                    <button key={min} onClick={() => setScoreFilter(scoreFilter === min ? null : min)}
                      className={clsx("px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-all",
                        scoreFilter === min ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                      ≥{min}
                    </button>
                  ))}
                </div>
                <div className="flex items-center bg-zinc-900/40 border border-zinc-800/40 rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={clsx("p-2.5 transition-all", viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}><LayoutGrid size={14} /></button>
                  <button onClick={() => setViewMode('list')} className={clsx("p-2.5 transition-all", viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}><List size={14} /></button>
                </div>
              </div>
            </div>

            {/* Category Tags */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {categories.slice(0, 15).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={clsx("px-3 py-1.5 rounded-full text-[11px] border transition-all",
                      selectedCategory === cat ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700')}>
                    {cat}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); setScoreFilter(null); }}
                    className="px-3 py-1.5 rounded-full text-[11px] border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-all">
                    <X size={10} /> Clear all
                  </button>
                )}
              </div>
            )}

            {/* Results Count */}
            <p className="text-sm text-zinc-500 mb-4">
              <span className="text-white font-semibold">{filteredItems.length}</span> report{filteredItems.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` matching filters`}
            </p>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredItems.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 transition-all group cursor-pointer relative overflow-hidden"
                    onClick={() => navigate(`/report/${item.id}`)}>
                    {item.score >= 8 && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />}
                    <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate group-hover:text-rose-400 transition-colors">{item.molecule}</h3>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.indication}</p>
                      </div>
                      <span className={clsx("font-mono font-bold text-xl shrink-0", item.score >= 8 ? 'text-emerald-400' : item.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{item.score.toFixed(1)}</span>
                    </div>
                    <div className="h-1 bg-zinc-800/40 rounded-full mb-3 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(item.score/10)*100}%` }} transition={{ duration: 0.6, delay: Math.min(i*0.03, 0.5)+0.2 }}
                        className={clsx("h-full rounded-full", item.score >= 8 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : item.score >= 5 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-amber-600 to-amber-400')} />
                    </div>
                    {item.summary && <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">{item.summary}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); toggleLike(item.id); }}
                          className={clsx("flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all",
                            likedIds.has(item.id) ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'border-zinc-800/40 text-zinc-500 hover:text-rose-400')}>
                          <Heart size={10} fill={likedIds.has(item.id) ? 'currentColor' : 'none'} /> Like
                        </button>
                        {item.userName && <span className="text-[10px] text-zinc-600">by {item.userName}</span>}
                      </div>
                      <span className="text-[10px] text-zinc-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredItems.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => navigate(`/report/${item.id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-center shrink-0">
                      <span className={clsx("font-mono font-bold text-lg", item.score >= 8 ? 'text-emerald-400' : item.score >= 5 ? 'text-cyan-400' : 'text-amber-400')}>{item.score.toFixed(1)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate group-hover:text-rose-400 transition-colors">{item.molecule}</h3>
                      <p className="text-[11px] text-zinc-500 truncate">{item.indication}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={e => { e.stopPropagation(); toggleLike(item.id); }}
                        className={clsx("p-2 rounded-lg transition-all", likedIds.has(item.id) ? 'text-rose-400' : 'text-zinc-600 hover:text-rose-400')}>
                        <Heart size={14} fill={likedIds.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                      <span className="text-[10px] text-zinc-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                      <ChevronRight size={14} className="text-zinc-600" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <Search size={32} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400 text-sm mb-2">No reports match your filters</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); setScoreFilter(null); }} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Clear all filters</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Pill, AlertTriangle, ShieldCheck, ShieldAlert, Loader2, Zap, Info, Plus,
  X, Download, Clock, Trash2, RotateCcw, ChevronDown, BookOpen, Microscope, Activity,
  Copy, CheckCircle, Sparkles, Target, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

type Severity = 'none' | 'mild' | 'moderate' | 'severe';

interface InteractionResult {
  severity: Severity;
  summary: string;
  mechanism: string;
  clinical_effect: string;
  recommendation: string;
  evidence_level: string;
}

interface CheckRecord { id: string; drug1: string; drug2: string; result: InteractionResult; timestamp: Date; }

const TOAST_STYLE = { background: '#18181b', color: '#fff', border: '1px solid #27272a' };

const severityConfig: Record<Severity, { color: string; bg: string; border: string; icon: any; label: string; gradient: string }> = {
  none: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: 'No Interaction', gradient: 'from-emerald-500' },
  mild: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Info, label: 'Mild', gradient: 'from-amber-500' },
  moderate: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle, label: 'Moderate', gradient: 'from-orange-500' },
  severe: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert, label: 'Severe', gradient: 'from-red-500' },
};

const COMMON_DRUGS = [
  'Metformin', 'Warfarin', 'Aspirin', 'Ibuprofen', 'Atorvastatin', 'Lisinopril',
  'Omeprazole', 'Amoxicillin', 'Ciprofloxacin', 'Metoprolol', 'Clopidogrel',
  'Sertraline', 'Fluoxetine', 'Gabapentin', 'Prednisone', 'Dexamethasone',
];

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
);

export default function InteractionPage() {
  const [drugs, setDrugs] = useState<string[]>(['', '']);
  const [results, setResults] = useState<Map<string, InteractionResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingPair, setLoadingPair] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckRecord[]>(() => {
    try { const h = JSON.parse(localStorage.getItem('interaction_history') || '[]'); return h.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [activeDrugIdx, setActiveDrugIdx] = useState<number | null>(null);
  const [expandedPair, setExpandedPair] = useState<string | null>(null);
  const navigate = useNavigate();

  const pairKey = (a: string, b: string) => [a, b].sort().join('::');
  const addDrug = () => { if (drugs.length < 6) setDrugs([...drugs, '']); };
  const removeDrug = (idx: number) => { if (drugs.length <= 2) return; setDrugs(drugs.filter((_, i) => i !== idx)); };
  const updateDrug = (idx: number, val: string) => setDrugs(drugs.map((d, i) => i === idx ? val : d));

  const checkPair = useCallback(async (d1: string, d2: string): Promise<InteractionResult | null> => {
    try {
      const res = await fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ drug1: d1, drug2: d2 }) });
      if (!res.ok) throw new Error('Check failed');
      return await res.json();
    } catch { return null; }
  }, []);

  const handleCheckAll = async () => {
    const validDrugs = drugs.map(d => d.trim()).filter(Boolean);
    if (validDrugs.length < 2) return;
    setLoading(true); setError(null);
    const newResults = new Map(results);
    const pairs: [string, string][] = [];
    for (let i = 0; i < validDrugs.length; i++)
      for (let j = i + 1; j < validDrugs.length; j++) {
        const key = pairKey(validDrugs[i], validDrugs[j]);
        if (!newResults.has(key)) pairs.push([validDrugs[i], validDrugs[j]]);
      }
    if (pairs.length === 0) { setLoading(false); return; }
    let checkedCount = 0;
    for (const [d1, d2] of pairs) {
      const key = pairKey(d1, d2);
      setLoadingPair(key);
      const result = await checkPair(d1, d2);
      if (result) {
        newResults.set(key, result);
        const record: CheckRecord = { id: `${Date.now()}-${key}`, drug1: d1, drug2: d2, result, timestamp: new Date() };
        setHistory(prev => { const next = [record, ...prev].slice(0, 50); localStorage.setItem('interaction_history', JSON.stringify(next)); return next; });
        checkedCount++;
      }
      setResults(new Map(newResults));
    }
    setLoadingPair(null); setLoading(false);
    if (checkedCount > 0) toast.success(`Checked ${checkedCount} drug pair${checkedCount > 1 ? 's' : ''}`, { style: TOAST_STYLE });
  };

  const validDrugs = useMemo(() => drugs.map(d => d.trim()).filter(Boolean), [drugs]);
  const matrixPairs = useMemo(() => {
    if (validDrugs.length < 2) return [];
    const pairs: { d1: string; d2: string; result: InteractionResult | undefined }[] = [];
    for (let i = 0; i < validDrugs.length; i++)
      for (let j = i + 1; j < validDrugs.length; j++) {
        pairs.push({ d1: validDrugs[i], d2: validDrugs[j], result: results.get(pairKey(validDrugs[i], validDrugs[j])) });
      }
    return pairs;
  }, [validDrugs, results]);

  const worstSeverity = useMemo(() => {
    const order: Severity[] = ['none', 'mild', 'moderate', 'severe'];
    let worst: Severity = 'none';
    for (const [, r] of results) { if (order.indexOf(r.severity) > order.indexOf(worst)) worst = r.severity; }
    return worst;
  }, [results]);

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
    for (const [, r] of results) counts[r.severity]++;
    return counts;
  }, [results]);

  const handleExport = () => {
    const data = Array.from(results.entries()).map(([key, r]) => { const [d1, d2] = key.split('::'); return { drug1: d1, drug2: d2, ...r }; });
    const blob = new Blob([JSON.stringify({ interactions: data, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'drug_interactions.json'; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported interactions', { style: TOAST_STYLE });
  };

  const handleClearAll = () => { setResults(new Map()); setDrugs(['', '']); setError(null); setLoadingPair(null); setExpandedPair(null); };

  const drugSuggestions = useMemo(() => {
    const current = activeDrugIdx !== null ? drugs[activeDrugIdx]?.trim().toLowerCase() : '';
    if (!current) return COMMON_DRUGS.slice(0, 8);
    return COMMON_DRUGS.filter(d => d.toLowerCase().includes(current) && !drugs.includes(d)).slice(0, 6);
  }, [activeDrugIdx, drugs]);

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Toaster position="bottom-right" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group">
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Zap className="text-amber-400" size={20} />
                </div>
                Drug-Drug Interaction Matrix
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">AI-powered multi-drug interaction checker with severity analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {results.size > 0 && (
              <>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all">
                  <Download size={14} /> Export
                </button>
                <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all">
                  <RotateCcw size={14} /> Reset
                </button>
              </>
            )}
            <button onClick={() => setShowHistory(!showHistory)} className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all border", showHistory ? 'bg-white/10 border-zinc-700 text-white' : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200')}>
              <Clock size={14} /> History {history.length > 0 && <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{history.length}</span>}
            </button>
          </div>
        </div>

        {/* Drug Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {drugs.map((drug, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Pill className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input
                    value={drug}
                    onChange={e => updateDrug(idx, e.target.value)}
                    onFocus={() => setActiveDrugIdx(idx)}
                    onBlur={() => setTimeout(() => setActiveDrugIdx(null), 200)}
                    placeholder={`Drug ${idx + 1}`}
                    className="w-full pl-9 pr-8 py-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all text-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && idx === drugs.length - 1 && drugs.length < 6) addDrug(); }}
                  />
                  {drug && (
                    <button onClick={() => updateDrug(idx, '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 p-1 rounded hover:bg-zinc-800/60 transition-all"><X size={12} /></button>
                  )}
                </div>
                {drugs.length > 2 && (
                  <button onClick={() => removeDrug(idx)} className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                )}
              </div>
              {/* Autocomplete */}
              <AnimatePresence>
                {activeDrugIdx === idx && drugSuggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
                    {drugSuggestions.map(s => (
                      <button key={s} onClick={() => { updateDrug(idx, s); setActiveDrugIdx(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 transition-all text-xs">
                        <Pill size={11} className="text-zinc-600" /> {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {drugs.length < 6 && (
            <button onClick={addDrug} className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-zinc-800/60 text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all text-sm">
              <Plus size={16} /> Add Drug
            </button>
          )}
        </div>

        {/* Check Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <button onClick={handleCheckAll} disabled={loading || validDrugs.length < 2}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 text-sm shadow-lg shadow-amber-500/10">
            {loading ? <><Loader2 className="animate-spin" size={18} /> Analyzing {loadingPair ? `(${loadingPair.split('::').join(' × ')})` : ''}...</> : <><Sparkles size={18} /> Check All Interactions</>}
          </button>
          <p className="text-xs text-zinc-500">
            {validDrugs.length < 2 ? 'Enter at least 2 drugs' : `${validDrugs.length} drugs → ${matrixPairs.length} unique pair${matrixPairs.length !== 1 ? 's' : ''} to analyze`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 mb-6">
            <AlertTriangle size={18} /> <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Loading Skeleton */}
        {loading && results.size === 0 && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40">
                  <div className="flex items-center gap-3 mb-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-40" /></div>
                  <Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.size > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Safety Summary */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-20 bg-gradient-to-br ${severityConfig[worstSeverity].gradient} to-transparent pointer-events-none`} />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={clsx("p-3 rounded-xl border", severityConfig[worstSeverity].bg, severityConfig[worstSeverity].border)}>
                    {(() => { const Icon = severityConfig[worstSeverity].icon; return <Icon size={24} className={severityConfig[worstSeverity].color} />; })()}
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Overall Safety Assessment</p>
                    <p className={`text-xl font-bold ${severityConfig[worstSeverity].color}`}>{severityConfig[worstSeverity].label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{results.size} interaction{results.size !== 1 ? 's' : ''} checked</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {(['none', 'mild', 'moderate', 'severe'] as Severity[]).map(s => severityCounts[s] > 0 && (
                    <div key={s} className="text-center">
                      <p className={`text-xl font-bold ${severityConfig[s].color}`}>{severityCounts[s]}</p>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interaction Matrix */}
            {validDrugs.length >= 3 && (
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 overflow-x-auto">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target size={14} className="text-zinc-500" /> Interaction Matrix
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold" />
                      {validDrugs.map(d => (
                        <th key={d} className="px-3 py-2 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validDrugs.map((d1, i) => (
                      <tr key={d1}>
                        <td className="px-3 py-2 text-xs font-medium text-zinc-300 whitespace-nowrap">{d1}</td>
                        {validDrugs.map((d2, j) => {
                          if (i === j) return <td key={d2} className="px-3 py-2 text-center"><div className="w-8 h-8 mx-auto rounded-lg bg-zinc-800/30 border border-zinc-800/30" /></td>;
                          if (i > j) return <td key={d2} />;
                          const key = pairKey(d1, d2);
                          const result = results.get(key);
                          if (!result) return <td key={d2} className="px-3 py-2 text-center"><div className="w-8 h-8 mx-auto rounded-lg bg-zinc-800/20 border border-zinc-800/20 flex items-center justify-center text-zinc-700 text-[10px]">—</div></td>;
                          const cfg = severityConfig[result.severity];
                          return (
                            <td key={d2} className="px-3 py-2 text-center">
                              <button onClick={() => setExpandedPair(expandedPair === key ? null : key)} className={clsx("w-10 h-10 mx-auto rounded-xl border flex items-center justify-center transition-all hover:scale-110", cfg.bg, cfg.border)} title={`${d1} × ${d2}: ${cfg.label}`}>
                                {(() => { const Icon = cfg.icon; return <Icon size={14} className={cfg.color} />; })()}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Microscope size={14} className="text-zinc-500" /> Detailed Analysis</h3>
              {matrixPairs.filter(p => p.result).map(({ d1, d2, result }) => {
                const key = pairKey(d1, d2);
                const r = result!;
                const cfg = severityConfig[r.severity];
                const isExpanded = expandedPair === key;
                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={clsx("rounded-2xl border transition-all overflow-hidden", isExpanded ? `${cfg.bg} ${cfg.border}` : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/40')}>
                    <button onClick={() => setExpandedPair(isExpanded ? null : key)} className="w-full p-5 flex items-center justify-between text-left">
                      <div className="flex items-center gap-4">
                        <div className={clsx("p-2 rounded-xl border", cfg.bg, cfg.border)}>
                          {(() => { const Icon = cfg.icon; return <Icon size={16} className={cfg.color} />; })()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{d1} <span className="text-zinc-600 mx-1">×</span> {d2}</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
                        </div>
                      </div>
                      <ChevronDown size={16} className={clsx("text-zinc-500 transition-transform", isExpanded && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 space-y-3">
                            <p className="text-sm text-zinc-300 leading-relaxed">{r.summary}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { label: 'Mechanism', value: r.mechanism, icon: Microscope },
                                { label: 'Clinical Effect', value: r.clinical_effect, icon: Activity },
                                { label: 'Recommendation', value: r.recommendation, icon: BookOpen },
                                { label: 'Evidence Level', value: r.evidence_level, icon: Target },
                              ].map(field => (
                                <div key={field.label} className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/30">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <field.icon size={10} className="text-zinc-500" />
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{field.label}</p>
                                  </div>
                                  <p className="text-xs text-zinc-300 leading-relaxed">{field.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[380px] max-w-full bg-zinc-950/98 backdrop-blur-xl border-l border-zinc-800/60 z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock size={16} className="text-amber-400" /> History</h3>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 transition-all"><X size={16} /></button>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-zinc-600 text-center py-12">No checks yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(record => {
                      const cfg = severityConfig[record.result.severity];
                      return (
                        <button key={record.id} onClick={() => { setDrugs([record.drug1, record.drug2]); setResults(new Map([[pairKey(record.drug1, record.drug2), record.result]])); setShowHistory(false); }}
                          className="w-full p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/40 text-left transition-all group">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">{record.drug1} × {record.drug2}</p>
                            <span className={clsx("text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border", cfg.bg, cfg.border, cfg.color)}>{cfg.label}</span>
                          </div>
                          <p className="text-[10px] text-zinc-600">{new Date(record.timestamp).toLocaleString()}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-check Info */}
        {results.size === 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'Multi-Drug Analysis', desc: 'Check up to 6 drugs at once. Every unique pair is analyzed for interactions.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { icon: ShieldAlert, title: 'Severity Grading', desc: 'AI grades each interaction by severity: none, mild, moderate, or severe.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                { icon: BookOpen, title: 'Clinical Guidance', desc: 'Get mechanism details, clinical effects, and actionable recommendations.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
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

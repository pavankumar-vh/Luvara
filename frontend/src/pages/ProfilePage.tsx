import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Camera, Lock, Eye, EyeOff, CheckCircle2, Shield, Activity,
  Database, Zap, Crown, Check, X, HelpCircle, ChevronDown, Star, TrendingUp,
  User as UserIcon, Settings, CreditCard, Loader2, KeyRound, Mail, Pencil,
  Rocket, BarChart3, Globe, FileText, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useRazorpay } from 'react-razorpay';
import toast, { Toaster } from 'react-hot-toast';

const TOAST_STYLE = { background: '#18181b', color: '#fff', border: '1px solid #27272a' };

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-cyan-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/60 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
      </div>
      <span className="font-bold text-white text-sm font-mono">{value}</span>
    </motion.div>
  );
}

// ─── Plan Feature Row ──────────────────────────────────────────────────────────
const PLAN_FEATURES = [
  { feature: 'Reports / mo', free: '3', researcher: '∞', org: '∞' },
  { feature: 'AI Agents', free: '2', researcher: '8', org: '8' },
  { feature: 'Data Sources', free: '5', researcher: 'All', org: 'All+' },
  { feature: 'Patent & IP', free: false, researcher: true, org: true },
  { feature: 'PDF Export', free: false, researcher: true, org: true },
  { feature: 'Safety Heatmaps', free: false, researcher: true, org: true },
  { feature: 'Team Seats', free: '1', researcher: '1', org: '10' },
  { feature: 'API Access', free: false, researcher: false, org: true },
  { feature: 'Priority Support', free: false, researcher: false, org: true },
];

const FAQ_ITEMS = [
  { q: 'Can I switch plans?', a: 'Yes! Upgrade or downgrade anytime. Changes take effect immediately with prorated billing.' },
  { q: 'What payment methods are accepted?', a: 'UPI, credit/debit cards, net banking, and wallets — all powered securely by Razorpay.' },
  { q: 'Is there a free trial?', a: 'The Explorer plan is free forever. Paid plans activate instantly upon subscription.' },
  { q: 'What is 8-agent execution?', a: 'All 8 specialized AI agents (Clinical, Literature, Regulatory, Target, Molecular, Patent, Market, Synthesis Lead) run simultaneously for comprehensive analysis.' },
  { q: 'What\'s the refund policy?', a: '7-day full refund, no questions asked. Contact support within 7 days of purchase.' },
  { q: 'Can I export reports?', a: 'Researcher and Organization plans support MDPI-style journal PDF exports with full citations.' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateProfile, updatePassword, checkAuth } = useAuth();
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { Razorpay } = useRazorpay();

  // Stats
  const [analysisRuns, setAnalysisRuns] = useState(0);
  const [reportsGenerated, setReportsGenerated] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    fetch('/api/auth/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalysisRuns(data.analysisRuns);
          setReportsGenerated(data.reportsGenerated);
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, activeTab, location.key]);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Upgrade state
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const hasPassword = user?.hasPassword ?? (user?.authProvider === 'local');
  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileError('Image must be under 2 MB'); return; }
    if (!file.type.startsWith('image/')) { setProfileError('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarData(result);
      setProfileError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const updates: { name?: string; email?: string; avatar?: string } = {};
      if (name !== (user?.name || '')) updates.name = name;
      if (email !== user?.email) updates.email = email;
      if (avatarData) updates.avatar = avatarData;
      await updateProfile(updates);
      setAvatarData(null);
      setProfileSuccess(true);
      toast.success('Profile updated successfully', { style: TOAST_STYLE });
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile', { style: TOAST_STYLE });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    setPasswordLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      toast.success('Password updated successfully', { style: TOAST_STYLE });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
      toast.error(err.message || 'Failed to update password', { style: TOAST_STYLE });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Shared Razorpay upgrade handler
  const handleUpgrade = useCallback(async (plan: 'researcher' | 'organization') => {
    setUpgradingPlan(plan);
    try {
      const orderRes = await fetch('/api/auth/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error('Failed to create order. Please try again.', { style: TOAST_STYLE }); return; }

      const themeColor = plan === 'researcher' ? '#f59e0b' : '#a855f7';
      const rzp = new Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SHFkFDv4q8dkSo',
        amount: orderData.order.amount.toString(),
        currency: orderData.order.currency,
        name: 'Phoenix Blueprint',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/auth/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await checkAuth();
              toast.success(`Upgraded to ${plan} plan!`, { style: TOAST_STYLE, icon: '🎉' });
            } else {
              toast.error('Payment verification failed. Contact support.', { style: TOAST_STYLE });
            }
          } catch {
            toast.error('Payment verification error. Contact support.', { style: TOAST_STYLE });
          }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: themeColor },
      } as any);

      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.', { style: TOAST_STYLE });
      });

      rzp.open();
    } catch {
      toast.error('Something went wrong. Please try again.', { style: TOAST_STYLE });
    } finally {
      setUpgradingPlan(null);
    }
  }, [Razorpay, user, checkAuth]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const planLabel = user?.plan && user.plan !== 'free' ? user.plan : 'free';
  const joinDate = user?.createdAt
    ? new Date(user.createdAt as string).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <main className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-zinc-800 relative overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/[0.05] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-10%] w-[30rem] h-[30rem] bg-violet-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center gap-4 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group">
          <ArrowLeft className="w-[18px] h-[18px] group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-white">Account Settings</h1>
          <p className="text-[11px] text-zinc-500 hidden sm:block">{user?.email || 'Manage your profile and subscription'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`p-2 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            title="Profile"
          >
            <UserIcon size={16} />
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={`p-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            title="Settings & Plans"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 relative z-10">

        {/* ─── Left Sidebar ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-[280px] lg:shrink-0 flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/[0.08] rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              {/* Avatar */}
              <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-cyan-500/30 blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Camera className="w-7 h-7" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
                    <Pencil className="w-4 h-4 text-white mb-1" />
                    <span className="text-[8px] font-bold text-white tracking-widest uppercase">Edit</span>
                  </div>
                </div>
                {user?.authProvider !== 'local' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" className="hidden" />

              <h2 className="text-base font-bold text-white mb-1 tracking-tight">{user?.name || 'Researcher'}</h2>

              {/* Plan badge */}
              {planLabel !== 'free' ? (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1.5 border ${
                  planLabel === 'organization'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  <Crown className="w-3 h-3" />
                  {planLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  Free Plan
                </span>
              )}
              <p className="text-[11px] text-zinc-500">{(user as any)?.role || 'Verified Researcher'}</p>
            </div>

            {/* Stats */}
            <div className="mt-5 space-y-2">
              {statsLoading ? (
                <>
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </>
              ) : (
                <>
                  <StatCard icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />} label="Analysis Runs" value={analysisRuns} color="bg-cyan-500/10" delay={0.1} />
                  <StatCard icon={<FileText className="w-3.5 h-3.5 text-emerald-400" />} label="Reports" value={reportsGenerated} color="bg-emerald-500/10" delay={0.15} />
                  <StatCard icon={<TrendingUp className="w-3.5 h-3.5 text-violet-400" />} label="Member Since" value={joinDate} color="bg-violet-500/10" delay={0.2} />
                </>
              )}
            </div>

            {/* Quick nav */}
            <div className="mt-4 pt-4 border-t border-zinc-800/40 space-y-1">
              {[
                { icon: <UserIcon size={14} />, label: 'Edit Profile', tab: 'profile' },
                { icon: <CreditCard size={14} />, label: 'Plans & Billing', tab: 'settings' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => setSearchParams(item.tab === 'profile' ? {} : { tab: item.tab })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === item.tab
                      ? 'bg-white/[0.06] text-white border border-zinc-700/40'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Comparison Table — only on settings tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <h4 className="font-bold text-white flex items-center gap-2 mb-3 text-sm">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Plan Comparison
              </h4>
              <div className="overflow-hidden rounded-lg border border-zinc-800/40">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800/60 bg-zinc-800/30">
                      <th className="text-left text-zinc-500 font-medium py-2 px-2">Feature</th>
                      <th className="text-center text-zinc-400 font-medium py-2 px-1">Free</th>
                      <th className="text-center text-amber-400 font-medium py-2 px-1">Pro</th>
                      <th className="text-center text-purple-400 font-medium py-2 px-1">Org</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-400">
                    {PLAN_FEATURES.map((row, i) => (
                      <tr key={i} className={`border-b border-zinc-800/20 ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                        <td className="py-1.5 px-2 text-zinc-300">{row.feature}</td>
                        {[row.free, row.researcher, row.org].map((val, j) => (
                          <td key={j} className="py-1.5 px-1 text-center">
                            {val === true ? <Check className="w-3 h-3 text-emerald-500 mx-auto" /> :
                             val === false ? <X className="w-3 h-3 text-zinc-700 mx-auto" /> :
                             <span className="text-zinc-300">{val as string}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Right Column ──────────────────────────────────────────────── */}
        <div className="w-full lg:flex-1 flex flex-col gap-5">

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800/50 w-fit backdrop-blur-sm">
            <button
              onClick={() => setSearchParams({})}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <UserIcon size={14} /> Profile
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'settings' })}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <CreditCard size={14} /> Plans & Billing
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PROFILE TAB                                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5">

              {/* Personal Information */}
              <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Personal Information</h3>
                    <p className="text-xs text-zinc-500">Update your identity and contact details</p>
                  </div>
                </div>

                {profileError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </motion.div>
                )}

                {profileSuccess && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Profile updated successfully</span>
                  </motion.div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">Full Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
                        className="bg-zinc-950 border-zinc-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 h-11 text-sm rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">Email Address</Label>
                      <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                        disabled={user?.authProvider !== 'local'}
                        className="bg-zinc-950 border-zinc-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 h-11 text-sm rounded-lg disabled:opacity-50" />
                      {user?.authProvider !== 'local' && (
                        <p className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Managed by {user?.authProvider}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={profileLoading || (name === user?.name && email === user?.email && !avatarData)}
                      className="bg-white text-black hover:bg-zinc-200 h-10 px-6 font-semibold rounded-lg shadow-md disabled:opacity-40 transition-all">
                      {profileLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security */}
              {hasPassword && (
                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Security</h3>
                      <p className="text-xs text-zinc-500">Update your password to keep your account secure</p>
                    </div>
                  </div>

                  {passwordError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                      <X className="w-4 h-4 shrink-0" /> {passwordError}
                    </motion.div>
                  )}
                  {passwordSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Password updated successfully
                    </motion.div>
                  )}

                  <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">Current Password</Label>
                      <div className="relative">
                        <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                          className="bg-zinc-950 border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 h-11 text-sm rounded-lg pr-10" />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">New Password</Label>
                        <div className="relative">
                          <Input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                            className="bg-zinc-950 border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 h-11 text-sm rounded-lg pr-10" />
                          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Password Strength Indicator */}
                        {newPassword && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                  className={`h-full rounded-full ${passwordStrength.color} transition-colors`}
                                />
                              </div>
                              <span className={`text-[10px] font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">Confirm Password</Label>
                        <div className="relative">
                          <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                            className="bg-zinc-950 border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 h-11 text-sm rounded-lg pr-10" />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword && newPassword && confirmPassword !== newPassword && (
                          <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Passwords don't match</p>
                        )}
                        {confirmPassword && newPassword && confirmPassword === newPassword && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                        className="bg-white text-black hover:bg-zinc-200 h-10 px-6 font-semibold rounded-lg shadow-md disabled:opacity-40 transition-all">
                        {passwordLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Account Info */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Account Information</h3>
                    <p className="text-xs text-zinc-500">Authentication and login details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/40">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Auth Provider</p>
                    <p className="text-sm text-white font-medium capitalize">{user?.authProvider || 'Local'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/40">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Current Plan</p>
                    <p className="text-sm text-white font-medium capitalize">{planLabel}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/40">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Member Since</p>
                    <p className="text-sm text-white font-medium">{joinDate}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SETTINGS TAB                                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5 items-start">

              {/* Plans Section */}
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Rocket className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Choose Your Plan</h3>
                    <p className="text-xs text-zinc-500">Upgrade to unlock advanced capabilities</p>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Free Plan */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className={`relative p-5 rounded-xl border flex flex-col transition-all ${(!user?.plan || user.plan === 'free') ? 'border-zinc-700/60 bg-zinc-800/20' : 'border-zinc-800/40 bg-zinc-900/20'}`}>
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h4 className="font-bold text-white text-sm">Explorer</h4>
                      {(!user?.plan || user.plan === 'free') && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase leading-none border border-emerald-500/20">Active</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-white mb-0.5">Free</p>
                    <p className="text-[11px] text-zinc-500 mb-4">Basic access forever</p>
                    <ul className="space-y-2 text-[13px] text-zinc-400 flex-1">
                      {['3 reports/month', 'Standard scoring', 'Top 5 data sources', 'Basic clinical insights', 'Community access'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <div className={`mt-4 w-full h-9 rounded-lg border flex items-center justify-center text-xs font-semibold ${(!user?.plan || user.plan === 'free') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800/40 bg-zinc-800/20 text-zinc-500'}`}>
                      {(!user?.plan || user.plan === 'free') ? '✓ Active Plan' : 'Free Tier'}
                    </div>
                  </motion.div>

                  {/* Researcher Plan */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`relative p-5 rounded-xl border flex flex-col transition-all ${
                      user?.plan === 'researcher'
                        ? 'border-amber-500/30 bg-amber-500/[0.03]'
                        : 'border-zinc-800/40 bg-zinc-900/20 hover:border-amber-500/20'
                    }`}>
                    {/* Most popular badge */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-black text-[9px] font-bold tracking-wider uppercase rounded-full shadow-lg shadow-amber-500/20 z-10">
                      Most Popular
                    </div>
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                        <Crown className="w-4 h-4 text-amber-400" /> Researcher
                      </h4>
                      {user?.plan === 'researcher' && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full uppercase leading-none border border-amber-500/20">Active</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <p className="text-2xl font-bold text-white">₹999</p>
                      <span className="text-xs text-zinc-500">/month</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mb-4">Full research power</p>
                    <ul className="space-y-2 text-[13px] text-zinc-400 flex-1">
                      {['Unlimited reports', 'Full 8-agent execution', 'Patent & IP analysis', 'PDF journal export', 'Safety heatmaps'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />{f}</li>
                      ))}
                    </ul>
                    {user?.plan === 'researcher' ? (
                      <div className="mt-4 w-full h-9 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-xs font-semibold text-amber-400">✓ Active Plan</div>
                    ) : user?.plan === 'organization' ? (
                      <div className="mt-4 w-full h-9 rounded-lg border border-zinc-800/40 bg-zinc-800/20 flex items-center justify-center text-xs text-zinc-500">Included</div>
                    ) : (
                      <Button onClick={() => handleUpgrade('researcher')} disabled={upgradingPlan === 'researcher'}
                        className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-9 rounded-lg shadow-lg shadow-amber-500/20 transition-all text-xs">
                        {upgradingPlan === 'researcher' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing...</> : 'Upgrade Now'}
                      </Button>
                    )}
                  </motion.div>

                  {/* Organization Plan */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className={`relative p-5 rounded-xl border flex flex-col transition-all ${
                      user?.plan === 'organization'
                        ? 'border-purple-500/30 bg-purple-500/[0.03]'
                        : 'border-zinc-800/40 bg-zinc-900/20 hover:border-purple-500/20'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                        <Crown className="w-4 h-4 text-purple-400" /> Organization
                      </h4>
                      {user?.plan === 'organization' && (
                        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full uppercase leading-none border border-purple-500/20">Active</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <p className="text-2xl font-bold text-white">₹2,499</p>
                      <span className="text-xs text-zinc-500">/month</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mb-4">For teams & organizations</p>
                    <ul className="space-y-2 text-[13px] text-zinc-400 flex-1">
                      {['Everything in Researcher', 'Private data orchestration', 'Team collaboration (10 seats)', 'Priority support', 'Full API access'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400/70 shrink-0" />{f}</li>
                      ))}
                    </ul>
                    {user?.plan === 'organization' ? (
                      <div className="mt-4 w-full h-9 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-xs font-semibold text-purple-400">✓ Active Plan</div>
                    ) : (
                      <Button onClick={() => handleUpgrade('organization')} disabled={upgradingPlan === 'organization'}
                        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold h-9 rounded-lg shadow-lg shadow-purple-500/20 transition-all text-xs">
                        {upgradingPlan === 'organization' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing...</> : 'Upgrade Now'}
                      </Button>
                    )}
                  </motion.div>
                </div>

                {/* Platform Highlights */}
                <div className="mt-5 p-4 rounded-xl border border-zinc-800/40 bg-zinc-800/10">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Platform Highlights
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    {[
                      { val: '50K+', label: 'Analyses Run', color: 'text-amber-400' },
                      { val: '98%', label: 'Accuracy Rate', color: 'text-emerald-400' },
                      { val: '2K+', label: 'Researchers', color: 'text-purple-400' },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/30">
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, bg: 'bg-amber-500/10', title: '8 AI Agents', sub: 'Parallel execution' },
                      { icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />, bg: 'bg-cyan-500/10', title: '7+ Data Sources', sub: 'Real-time querying' },
                      { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/10', title: 'Enterprise Security', sub: 'SOC 2 compliant' },
                      { icon: <Star className="w-3.5 h-3.5 text-purple-400" />, bg: 'bg-purple-500/10', title: 'Trusted by Labs', sub: 'Global research teams' },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/20">
                        <div className={`w-7 h-7 rounded-lg ${h.bg} flex items-center justify-center shrink-0`}>{h.icon}</div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-white truncate">{h.title}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{h.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQ sidebar */}
              <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 h-fit sticky top-20">
                <h4 className="font-bold text-white flex items-center gap-2 mb-4 text-sm">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  FAQ
                </h4>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, i) => (
                    <details key={i} className="group rounded-lg border border-zinc-800/40 bg-zinc-800/10 overflow-hidden transition-all">
                      <summary className="flex items-center justify-between cursor-pointer px-3 py-2.5 text-xs text-zinc-300 hover:text-white transition-colors select-none">
                        <span className="pr-2">{faq.q}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-open:rotate-180 transition-transform duration-200 shrink-0" />
                      </summary>
                      <div className="px-3 pb-3">
                        <p className="text-[11px] text-zinc-500 leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>

                {/* Help link */}
                <div className="mt-4 pt-3 border-t border-zinc-800/40">
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Need help? Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-mono">⌘K</kbd> for quick navigation or reach out via support.
                  </p>
                </div>
              </div>

            </motion.div>
          )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}

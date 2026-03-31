import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Activity, FileText, Sparkles, BrainCircuit, Send,
  ChevronRight, ArrowRight, CheckCircle, Database, FlaskConical,
  TrendingUp, Shield, Microscope, Network, Bot, Gavel,
  BookOpen, TestTube, BarChart3, Check, Zap, Menu, X, ChevronDown, Star,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ShaderButton } from '@/components/ui/ShaderButton';
import { useRazorpay } from "react-razorpay";
import { TypewriterHero } from '@/components/TypewriterHero';
import { AnimatedCounter } from '@/components/AnimatedCounter';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Instant Search',
    description: 'Query millions of data points instantly across global databases and private registries with deep semantic understanding.',
    floatY: -10,
    floatD: 5.5,
  },
  {
    icon: <BrainCircuit className="w-5 h-5" />,
    title: 'AI Synthesis',
    description: 'Multi-agent systems synthesize complex pharmacological papers and disparate data into actionable insights.',
    floatY: 12,
    floatD: 6.5,
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Real-time Data',
    description: 'Live tracking and dynamic monitoring of competitive clinical trials and shifting regulatory pathways.',
    floatY: -8,
    floatD: 5.0,
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Structured Reports',
    description: 'Automated generation of submission-ready evaluation reports, detailed target profiles, and viability scores.',
    floatY: 10,
    floatD: 7.0,
  },
];

// Absolute positions for each hero card (anchored to hero viewport edges)
// Cards are intentionally half-offscreen to create the "peeking" look.

const STEPS = [
  { step: '01', title: 'Enter Compound',         description: 'Input any drug name or molecule identifier. Our system resolves CIDs, synonyms, and canonical forms automatically.' },
  { step: '02', title: '8 Agents Fire',           description: '8 specialized agents simultaneously query ClinicalTrials.gov, PubMed, PubChem, Open Targets, USPTO, openFDA, ChEMBL, and Semantic Scholar.' },
  { step: '03', title: 'AI Synthesis',           description: 'The Synthesis Lead Agent ingests all sub-agent outputs via Groq LLM to compute Phoenix Score and semantic repurposing insights.' },
  { step: '04', title: 'Scoring & Ranking',      description: 'Repurposing candidates are ranked by evidence strength, phase progression, patent openness, and market opportunity.' },
  { step: '05', title: 'Report Generated',       description: 'A comprehensive MDPI-style journal report is ready with all insights, scores, figures, and source citations.' },
];

const AGENTS = [
  {
    num: '01',
    name: 'Clinical Agent',
    icon: <Activity className="w-4 h-4" />,
    desc: 'Discovers all human trials the molecule has undergone — phases, statuses, conditions, and NCT IDs.',
  },
  {
    num: '02',
    name: 'Literature Agent',
    icon: <BookOpen className="w-4 h-4" />,
    desc: 'Aggregates published abstracts to generate a literature density signal and citation graph.',
  },
  {
                      num: '03',
    name: 'Regulatory Agent',
    icon: <Shield className="w-4 h-4" />,
    desc: 'Pulls FDA-approved labels, box warnings, and structural safety constraints from openFDA.',
  },
  {
    num: '04',
    name: 'Target Agent',
    icon: <Network className="w-4 h-4" />,
    desc: 'Maps direct biological target associations, disease connections, and metabolic mechanisms.',
  },
  {
    num: '05',
    name: 'Molecular Agent',
    icon: <TestTube className="w-4 h-4" />,
    desc: 'Retrieves physicochemical properties (Lipinski RO5, stereocenters) and structural analogs.',
  },
  {
    num: '06',
    name: 'Patent & IP Agent',
    icon: <Gavel className="w-4 h-4" />,
    desc: 'Evaluates the IP landscape, detecting existing patents and freedom-to-operate gaps.',
  },
  {
    num: '07',
    name: 'Market Intelligence Agent',
    icon: <BarChart3 className="w-4 h-4" />,
    desc: 'Approximates global market size and historical CAGRs per indication via LLM inference.',
  },
  {
    num: '08',
    name: 'Synthesis Lead Agent',
    icon: <BrainCircuit className="w-4 h-4" />,
    desc: 'The orchestrator. Ingests all sub-agent outputs to compute the Phoenix Score and report insights.',
    highlight: true,
  },
];

const DATA_SOURCES = [
  { name: 'ClinicalTrials.gov', desc: 'Clinical trial phases & status',    color: 'text-blue-500 dark:text-blue-400'   },
  { name: 'PubChem',            desc: 'Molecular properties & chemistry',  color: 'text-emerald-500 dark:text-emerald-400' },
  { name: 'Semantic Scholar',   desc: 'Scientific literature & citations', color: 'text-cyan-500 dark:text-cyan-400' },
  { name: 'USPTO PatentsView',  desc: 'Patent filings & IP landscape',     color: 'text-amber-500 dark:text-amber-400'  },
  { name: 'Open Targets',       desc: 'Disease–target associations',       color: 'text-rose-500 dark:text-rose-400'    },
  { name: 'openFDA',            desc: 'Drug approvals & adverse events',   color: 'text-cyan-500 dark:text-cyan-400'    },
  { name: 'NCBI / PubMed',      desc: 'Biomedical research database',      color: 'text-cyan-500 dark:text-cyan-400'},
];

const TESTIMONIALS = [
  {
    quote: "This platform cut our preliminary drug screening time from weeks to minutes. The Phoenix Score gives us confidence to prioritize candidates.",
    name: "Dr. Priya Sharma",
    role: "Senior Research Scientist",
    org: "Biotech Startup, Bangalore",
  },
  {
    quote: "The multi-agent architecture is brilliant. Having 8 specialized AI agents simultaneously query real databases gives us data density we can't get anywhere else.",
    name: "James Chen",
    role: "Computational Pharmacologist",
    org: "University Research Lab",
  },
  {
    quote: "We use the Compare feature daily. Being able to benchmark two compounds head-to-head with real clinical and patent data is a game changer for our pipeline decisions.",
    name: "Dr. Ananya Patel",
    role: "VP of Drug Discovery",
    org: "Pharmaceutical R&D",
  },
];

const REPORT_TABS = [
  { icon: <Sparkles className="w-4 h-4" />,     title: 'Overview',             desc: 'Executive summary, confidence scoring, and top repurposing candidates ranked by evidence strength.' },
  { icon: <FlaskConical className="w-4 h-4" />, title: 'Science',              desc: 'ADMET properties, Lipinski Rule of 5, target binding analysis, and full pharmacokinetics profile.' },
  { icon: <Shield className="w-4 h-4" />,       title: 'Clinical & IP',        desc: 'Trial phase distribution, competitive landscape, patent expiry, and freedom-to-operate insights.' },
  { icon: <TrendingUp className="w-4 h-4" />,   title: 'Market Intelligence',  desc: 'Total addressable market, CAGR projections, and opportunity scoring per indication.' },
  { icon: <Microscope className="w-4 h-4" />,   title: 'Molecular Twin',       desc: '3D structure visualization with similar compound analysis and structural comparison matrix.' },
];

const STATS = [
  { value: 500000,  suffix: '+', label: 'Molecules Indexed' },
  { value: 8,       suffix: '',  label: 'AI Agents' },
  { value: 2.5,     suffix: 'M+', label: 'Clinical Trials', decimals: 1 },
  { value: 360,     suffix: '°',  label: 'Coverage' },
];

const PRICING_PLANS = [
  {
    name: 'Explorer',
    price: 'Free',
    period: 'forever',
    desc: 'Perfect for exploring the capabilities of our AI pipeline.',
    features: [
      'Up to 3 basic reports per month',
      'Standard Phoenix Score formulation',
      'Access to top 5 data sources',
      'Community support'
    ],
    buttonText: 'Get Started',
    highlight: false,
  },
  {
    name: 'Researcher',
    price: '₹999',
    period: 'per month',
    desc: 'Advanced intelligence for dedicated researchers and labs.',
    features: [
      'Unlimited comprehensive reports',
      'Full 8-agent parallel execution',
      'Patent & IP landscape analysis',
      'Export to MDPI-style journal PDFs'
    ],
    buttonText: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Research Organization',
    price: '₹2,499',
    period: 'per month',
    desc: 'Tailored infrastructure for pharma teams & research organizations.',
    features: [
      'Everything in Researcher',
      'Private data orchestration',
      'Team collaboration & sharing',
      'Priority support & analytics'
    ],
    buttonText: 'Upgrade Now',
    highlight: false,
  }
];

// ─── Shared card shell ────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative group bg-white/5 dark:bg-[#0c0c0e]/40 backdrop-blur-[24px] border border-slate-300/50 dark:border-slate-400/50 p-7 rounded-3xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)] hover:border-slate-300/70 dark:hover:border-slate-300/80 hover:shadow-[0_16px_48px_rgba(0,50,200,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:hover:shadow-[0_16px_48px_rgba(100,150,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.15),0_0_20px_rgba(100,150,255,0.1)] transition-all duration-500 select-none h-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 opacity-50 dark:opacity-20 pointer-events-none" />
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-2xl rounded-3xl" />
      
      <div className="relative z-10 p-3 bg-white/60 dark:bg-white/5 border border-slate-300/50 dark:border-slate-400/50 backdrop-blur-md rounded-xl w-fit mb-5 group-hover:scale-110 group-hover:bg-white/80 dark:group-hover:bg-white/10 transition-all duration-500 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
        <span className="text-blue-600 dark:text-zinc-300">{icon}</span>
      </div>
      <h3 className="relative z-10 text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2.5 tracking-tight drop-shadow-sm">
        {title}
      </h3>
      <p className="relative z-10 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors duration-300 leading-relaxed text-sm font-light">
        {description}
      </p>
    </motion.div>
  );
}

const HERO_OFFSETS_DESKTOP = [
  { x: "-25.8vw", y: "-110vh", rotate: 10 },
  { x: "25vw", y: "-113vh", rotate: -10 },
  { x: "-20vw", y: "-90vh", rotate: -6 },
  { x: "25vw", y: "-90vh", rotate: 8 },
];

const HERO_OFFSETS_MOBILE = [
  { x: "0vw", y: "-20vh", rotate: 3 },
  { x: "0vw", y: "-20vh", rotate: -3 },
  { x: "0vw", y: "-20vh", rotate: -2 },
  { x: "0vw", y: "-20vh", rotate: 2 },
];

function AnimatedFeatureCard({ scrollYProgress, index, feature }: { scrollYProgress: MotionValue<number>; index: number; feature: typeof FEATURES[0] }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const init = isMobile ? HERO_OFFSETS_MOBILE[index] : HERO_OFFSETS_DESKTOP[index];

  const x = useTransform(scrollYProgress, [0, 0.8], [init.x, "0vw"]);
  const y = useTransform(scrollYProgress, [0, 0.8], [init.y, "0vh"]);
  const rotate = useTransform(scrollYProgress, [0, 0.8], [init.rotate, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [isMobile ? 0.95 : 0.82, 1]);

  return (
    <motion.div style={{ x, y, rotate, scale }} className="h-full z-10 w-full md:w-[420px] max-w-full mx-auto pointer-events-none md:pointer-events-auto">
      <motion.div
        animate={{ y: [0, feature.floatY, 0] }}
        transition={{ duration: feature.floatD, repeat: Infinity, ease: 'easeInOut', delay: index * 0.9 }}
        className="h-full"
      >
        <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { Razorpay } = useRazorpay();
  const featuresRef = React.useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "center center"]
  });

  const handleStartAnalysis = () => {
    if (!user) { navigate('/login'); return; }
    setIsNavigating(true);
    setTimeout(() => navigate('/search'), 1500);
  };

  const handleSubscriptionPay = React.useCallback(async (planName: string, amountStr: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (planName === "Explorer") {
        return;
    }

    const planKey = planName === "Research Organization" ? "organization" : planName.toLowerCase();

    try {
      // 1. Create order on backend
      const orderRes = await fetch('/api/auth/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planKey }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert('Failed to create order. Please try again.');
        return;
      }

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SHFkFDv4q8dkSo',
        amount: orderData.order.amount.toString(),
        currency: orderData.order.currency,
        name: "Phoenix Blueprint",
        description: `${planName} Subscription`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // 2. Verify payment on backend
          try {
            const verifyRes = await fetch('/api/auth/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              // Refresh auth to get updated plan
              await checkAuth();
              navigate('/search');
            } else {
              alert('Payment verification failed. Contact support.');
            }
          } catch {
            alert('Payment verification error. Contact support.');
          }
        },
        prefill: {
          name: user.name || "User",
          email: user.email || "user@example.com",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp1 = new Razorpay(options);

      rzp1.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });

      rzp1.open();
    } catch {
      alert('Something went wrong. Please try again.');
    }

  }, [Razorpay, user, navigate, checkAuth]);

  return (
    <main className="bg-[#f8fafc] dark:bg-[#000000] text-zinc-900 dark:text-[#ededed] font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 relative overflow-x-hidden">
      {/* Navbar */}
      <header className="absolute top-0 left-0 right-0 px-4 py-4 sm:p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500 dark:bg-white flex items-center justify-center">
            <div className="w-3 h-3 bg-white dark:bg-black rounded-sm" />
          </div>
        </div>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          <button onClick={() => navigate("/")} className="hover:text-zinc-900 dark:hover:text-zinc-200">HOME</button>
          <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-zinc-900 dark:hover:text-zinc-200">FEATURES</button>
          <button onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-zinc-900 dark:hover:text-zinc-200">PLANS</button>
          <button onClick={() => navigate("/compare")} className="hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1">COMPARE</button>
          <div className="relative group">
            <button className="hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1">TOOLS <ChevronDown size={10} /></button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-2 min-w-[200px] shadow-2xl">
                <button onClick={() => navigate("/biomarker")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-left transition-colors">
                  <Microscope size={14} className="text-cyan-500" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 normal-case tracking-normal font-medium">Biomarker Pipeline</span>
                </button>
                <button onClick={() => navigate("/interactions")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-left transition-colors">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 normal-case tracking-normal font-medium">Drug Interactions</span>
                </button>
                <button onClick={() => navigate("/collections")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-left transition-colors">
                  <FlaskConical size={14} className="text-emerald-500" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 normal-case tracking-normal font-medium">Collections</span>
                </button>
                <button onClick={() => navigate("/gallery")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-left transition-colors">
                  <Database size={14} className="text-rose-500" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 normal-case tracking-normal font-medium">Report Gallery</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {!user ? (
            <>
              <button 
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest hidden sm:block"
              >
                LOG IN
              </button>
              <button 
                onClick={() => navigate("/signup")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2 transition-colors"
              >
                GET STARTED <ArrowRight className="w-3 h-3 -rotate-45" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate("/search")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2 transition-colors"
            >
              DASHBOARD <ArrowRight className="w-3 h-3 -rotate-45" />
            </button>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[60px] z-50 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 shadow-lg"
          >
            <nav className="flex flex-col items-center gap-1 py-4 px-6">
              <button onClick={() => { navigate("/"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest">HOME</button>
              <button onClick={() => { document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest">FEATURES</button>
              <button onClick={() => { document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest">PLANS</button>
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1" />
              <button onClick={() => { navigate("/biomarker"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest flex items-center justify-center gap-2"><Microscope size={14} /> BIOMARKER</button>
              <button onClick={() => { navigate("/interactions"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest flex items-center justify-center gap-2"><Zap size={14} /> INTERACTIONS</button>
              <button onClick={() => { navigate("/collections"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest flex items-center justify-center gap-2"><FlaskConical size={14} /> COLLECTIONS</button>
              <button onClick={() => { navigate("/gallery"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest flex items-center justify-center gap-2"><Database size={14} /> GALLERY</button>
              {!user && (
                <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest sm:hidden">LOG IN</button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Fixed background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_90%_70%_at_50%_30%,#000_10%,transparent_100%)]" />

      {/* Ambient hero glow orbs */}
      <div className="fixed top-[-10%] left-[15%] w-[500px] h-[500px] bg-blue-500/[0.04] dark:bg-cyan-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[10%] right-[10%] w-[400px] h-[400px] bg-violet-500/[0.03] dark:bg-violet-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <style>{`@keyframes gradient { 0%,100% { background-position: 0% center; } 50% { background-position: 100% center; } }`}</style>

      {/* Navigation transition overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 1.1 }} className="absolute inset-0 bg-white dark:bg-black z-40" />
            <motion.div initial={{ x: '-50vw', y: '50vh', scale: 0.5, opacity: 0 }} animate={{ x: 0, y: 0, scale: 1.5, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="relative z-50 flex items-center justify-center">
              <motion.div initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: -300, y: -200, rotate: -45, opacity: 0 }} transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }} style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} className="absolute">
                <Send className="w-24 h-24 text-zinc-400 dark:text-zinc-300 drop-shadow-2xl" strokeWidth={1} fill="currentColor" />
              </motion.div>
              <motion.div initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: 300, y: 200, rotate: 45, opacity: 0 }} transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }} style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} className="absolute">
                <Send className="w-24 h-24 text-zinc-400 dark:text-zinc-300 drop-shadow-2xl" strokeWidth={1} fill="currentColor" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Full viewport. Hero text sits above everything.
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[560px] sm:min-h-[640px] overflow-hidden flex items-center justify-center z-10 pointer-events-none">

        {/* ── Hero text (z-20) ─────────────────────────────── */}
        <div className="relative z-20 flex flex-col items-center text-center px-6 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center max-w-3xl pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-wide mb-8 shadow-lg shadow-zinc-200/20 dark:shadow-black/30"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              NEXT-GEN DISCOVERY ENGINE
            </motion.div>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[84px] font-bold tracking-tighter leading-[1.05] mb-5 sm:mb-7">
              <TypewriterHero
                staticPrefix=""
                words={['Autonomous', 'Intelligent', 'Real-time', 'Multi-Agent']}
                className="text-zinc-900 dark:text-white"
              />
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 dark:from-cyan-300 dark:via-blue-400 dark:to-violet-400 animate-[gradient_6s_ease_infinite] bg-[length:200%_auto]">
                Research Platform
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl text-center mb-8 sm:mb-10 font-light leading-relaxed px-2">
              Analyze clinical trials, literature, and regulatory data in seconds using advanced multi-agent orchestrations.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ShaderButton onClick={handleStartAnalysis}>
                Start Analysis
              </ShaderButton>
              <a
                href="#features"
                className="py-4 px-8 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                See how it works <ChevronRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-9 border border-zinc-300 dark:border-zinc-700 rounded-full flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full" />
          </motion.div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Scroll</span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — FEATURES GRID
          A completely separate full viewport. Cards fly in from the hero's
          scattered positions and settle into a centered 2×2 grid.
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        ref={featuresRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 border-t border-zinc-100 dark:border-zinc-800/40 z-0"
      >
        {/* Section heading animates up from below */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Unified Intelligence
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
            Scattered data points converge into a structured, actionable pipeline.
          </p>
        </motion.div>

        {/* 2×2 Grid — each card flies in from its hero position on scroll */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {FEATURES.map((f, i) => (
            <AnimatedFeatureCard key={i} scrollYProgress={scrollYProgress} index={i} feature={f} />
          ))}
        </div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-10 sm:py-14 border-y border-zinc-200 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 dark:from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <AnimatedCounter
                  key={i}
                  target={s.value}
                  suffix={s.suffix}
                  label={s.label}
                  duration={2.5}
                  decimals={(s as any).decimals || 0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ADVANCED RESEARCH TOOLS ──────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-b border-zinc-100 dark:border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <Zap size={12} className="text-amber-500" />
              ADVANCED TOOLKIT
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Beyond Standard Analysis
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-2xl mx-auto">
              Four specialized research tools that go deeper than any standard drug database.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Microscope className="w-6 h-6" />,
                title: 'Biomarker → Drug Pipeline',
                desc: 'Reverse drug discovery. Enter a gene target like EGFR or BRCA1 and discover every drug that modulates it — with clinical phase tracking, mechanism grouping, and pipeline scoring.',
                tag: 'Open Targets Integration',
                tagColor: 'text-cyan-500',
                link: '/biomarker',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Drug-Drug Interaction Matrix',
                desc: 'Check up to 6 drugs simultaneously. AI analyzes every unique pair for severity, mechanism, and clinical effect — with a visual interaction matrix and evidence levels.',
                tag: 'Multi-Drug Support',
                tagColor: 'text-amber-500',
                link: '/interactions',
              },
              {
                icon: <FlaskConical className="w-6 h-6" />,
                title: 'Research Collections',
                desc: 'Organize your bookmarked molecules into named folders. Add annotations, filter by score, bulk manage, and export your curated research library.',
                tag: 'Smart Organization',
                tagColor: 'text-emerald-500',
                link: '/collections',
              },
              {
                icon: <Database className="w-6 h-6" />,
                title: 'Public Report Gallery',
                desc: 'Explore community-shared drug repurposing analyses. Filter by indication, sort by Phoenix Score, and discover high-scoring repurposing opportunities.',
                tag: 'Community Discovery',
                tagColor: 'text-rose-500',
                link: '/gallery',
              },
            ].map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigate(user ? tool.link : '/login')}
                className="relative group bg-white/70 dark:bg-[#0a0a0b]/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl group-hover:scale-110 transition-transform duration-300 text-zinc-600 dark:text-zinc-300 shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{tool.title}</h3>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${tool.tagColor} mb-3 block`}>{tool.tag}</span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto font-light">
              From molecule name to comprehensive repurposing report in minutes.
            </p>
          </motion.div>

          <div className="relative">
            {/* Horizontal connector line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[calc(10%+32px)] right-[calc(10%+32px)] h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
            {/* Vertical connector line — mobile only */}
            <div className="md:hidden absolute left-1/2 -translate-x-px top-16 bottom-16 w-px bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-6 md:gap-4">
              {STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 sm:mb-5 relative z-10 shadow-sm">
                    <span className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">{s.step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2 leading-tight">{s.title}</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-[260px] sm:max-w-none">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8 AI AGENTS ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <Bot size={12} className="text-cyan-500" />
              MULTI-AGENT ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              8 Specialized AI Agents
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-2xl mx-auto">
              Each agent is a domain expert. They fire in parallel and their outputs are fused by the Synthesis Lead Agent into a unified intelligence report.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 w-full">
            {[
              { start: 0, end: 4 },
              { start: 4, end: 7 },
              { start: 7, end: 8 }
            ].map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap justify-center gap-4">
                {AGENTS.slice(row.start, row.end).map((agent, idx) => {
                  const i = row.start + idx;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      viewport={{ once: true }}
                      className="relative group rounded-2xl transition-all duration-300 cursor-default overflow-hidden shrink-0 flex-grow-0 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-12px)]"
                    >
                      {/* Background gradient */}
                      <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                        agent.highlight
                          ? 'bg-gradient-to-br from-zinc-200/80 to-zinc-100/60 dark:from-zinc-800/60 dark:to-zinc-700/40'
                          : 'bg-gradient-to-br from-zinc-100/80 to-zinc-50/60 dark:from-zinc-900/60 dark:to-zinc-800/40'
                      }`} />

                      {/* Border gradient effect */}
                      <div className={`absolute inset-0 rounded-2xl border transition-all duration-300 pointer-events-none ${
                        agent.highlight
                          ? 'border-zinc-300 dark:border-zinc-600 shadow-md'
                          : 'border-zinc-200/60 dark:border-zinc-700/60 group-hover:border-zinc-300 dark:group-hover:border-zinc-600'
                      }`} />

                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: agent.highlight
                            ? 'radial-gradient(circle at 30% 30%, rgba(6,182,212,0.15) 0%, transparent 60%)'
                            : 'radial-gradient(circle at 30% 30%, rgba(6,182,212,0.08) 0%, transparent 60%)'
                        }}
                      />

                      {/* Content */}
                      <div className={`relative z-10 p-6 h-full flex flex-col ${agent.highlight ? 'lg:p-8' : ''}`}>
                        {/* Top row with number and icon */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`text-xs font-mono font-bold tracking-wider ${
                              agent.highlight
                                ? 'text-cyan-300 dark:text-cyan-200'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}>{agent.num}</span>
                          </div>

                          {/* Icon background with glow */}
                          <div className={`relative group/icon transition-all duration-300 ${
                            agent.highlight
                              ? 'p-3 bg-cyan-500/20 dark:bg-cyan-500/15 rounded-xl'
                              : 'p-2.5 bg-zinc-200/70 dark:bg-zinc-700/50 rounded-lg group-hover:bg-zinc-300/70 dark:group-hover:bg-zinc-600/70'
                          }`}>
                            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none
                              ${agent.highlight
                                ? 'bg-gradient-to-br from-cyan-400/20 to-blue-400/10'
                                : 'bg-gradient-to-br from-cyan-400/10 to-blue-400/5'
                              }`}
                            />
                            <span className={`relative ${
                              agent.highlight
                                ? 'text-cyan-300 dark:text-cyan-200'
                                : 'text-zinc-600 dark:text-zinc-300'
                            }`}>
                              {agent.icon}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm font-semibold mb-3 leading-tight transition-colors duration-300 ${
                          agent.highlight
                            ? 'text-white dark:text-zinc-50 text-base'
                            : 'text-zinc-800 dark:text-zinc-100'
                        }`}>
                          {agent.name}
                        </h3>

                        {/* Description */}
                        <p className={`text-xs leading-relaxed flex-1 transition-colors duration-300 ${
                          agent.highlight
                            ? 'text-cyan-100/90 dark:text-cyan-200/80'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {agent.desc}
                        </p>

                        {/* Orchestrator badge */}
                        {agent.highlight && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="inline-flex items-center text-[10px] font-semibold text-cyan-300 dark:text-cyan-200 px-2.5 py-1 rounded-full bg-cyan-500/20 dark:bg-cyan-500/15 border border-cyan-400/30 dark:border-cyan-400/20 uppercase tracking-wide">
                              ⚡ Orchestrator
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA SOURCES ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <Database size={12} />
              REAL DATA ONLY
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Powered by Real Data
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
              Every insight is grounded in authoritative, real-time data from global scientific databases.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {DATA_SOURCES.map((ds, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                viewport={{ once: true }}
                className="bg-white/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-default"
              >
                <div className={`text-sm sm:text-base font-bold mb-1.5 ${ds.color}`}>{ds.name}</div>
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{ds.desc}</div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.49 }}
              viewport={{ once: true }}
              className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex items-center justify-center"
            >
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">+ more <ArrowRight size={11} /></span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── REPORT SECTIONS ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Comprehensive Reports
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
              Every report covers five critical dimensions of drug repurposing analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {REPORT_TABS.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/70 dark:bg-[#0a0a0b]/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 text-zinc-500 dark:text-zinc-400 group-hover:scale-110 transition-transform duration-300">
                  {r.icon}
                </div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-2 tracking-tight">{r.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <Sparkles size={12} className="text-emerald-500" />
              TRUSTED BY RESEARCHERS
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              What Researchers Say
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
              Built for researchers, by researchers. Here's what early users think.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative bg-white/70 dark:bg-[#0a0a0b]/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
              >
                <div className="absolute top-6 right-6 text-5xl font-serif text-zinc-100 dark:text-zinc-800 leading-none select-none">"</div>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6 relative z-10 font-medium">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/20">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.role} · {t.org}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO PREVIEW ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <FlaskConical size={12} className="text-cyan-500" />
              SEE IT IN ACTION
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              From Search to Insight
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
              Watch how a single molecule query becomes a comprehensive repurposing intelligence report.
            </p>
          </motion.div>

          {/* Mock Report Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-4xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-200/30 dark:shadow-black/30">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center">
                    <FlaskConical size={20} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Metformin</h3>
                    <p className="text-xs text-zinc-500">Analysis Report · Phoenix Score: 8.4/10</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">High Viability</span>
                </div>
              </div>

              {/* Mock metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Clinical Trials', value: '247', color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Publications', value: '1,842', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Patents', value: '38', color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Indications', value: '12', color: 'text-cyan-600 dark:text-cyan-400' },
                ].map((m, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Mock top candidates */}
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800/60">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">Top Repurposing Candidates</h4>
                <div className="space-y-2.5">
                  {[
                    { name: 'Non-small-cell Lung Cancer', score: 8.2, phase: 'Phase III' },
                    { name: 'Breast Cancer', score: 7.8, phase: 'Phase II' },
                    { name: 'Polycystic Ovary Syndrome', score: 7.5, phase: 'Phase III' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-400 w-5">{i + 1}.</span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{c.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400 rounded-full">{c.phase}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA overlay */}
              <div className="mt-6 flex justify-center">
                <button onClick={handleStartAnalysis}
                  className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2">
                  Try it yourself <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
        <section id="plans" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-6">
              <Zap size={12} className="text-amber-500" />
              SUBSCRIPTION PLANS
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Flexible Plans for Every Scale
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-light max-w-xl mx-auto">
              Choose the perfect tier for your drug repurposing workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex flex-col p-6 sm:p-8 rounded-3xl transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-slate-200/50 to-slate-100/50 dark:from-zinc-800/80 dark:to-zinc-900/50 border-2 border-slate-300 dark:border-zinc-600 shadow-xl shadow-slate-200/50 dark:shadow-zinc-900/50'
                    : 'bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-slate-800 dark:bg-zinc-300 text-white dark:text-zinc-900 text-[10px] font-bold tracking-widest uppercase rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 font-medium">/{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-slate-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                        <Check size={12} className={plan.highlight ? 'text-slate-700 dark:text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'} />
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.open('https://wa.me/916382957995', '_blank', 'noopener,noreferrer');
                    } else if (plan.name === 'Researcher') {
                        handleSubscriptionPay(plan.name, plan.price)
                    } else {
                      navigate(user ? '/search' : '/login');
                    }
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                    plan.highlight
                      ? 'bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-slate-700 dark:hover:bg-white shadow-md shadow-slate-900/10'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-zinc-100 dark:border-zinc-800/40">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-8">
            <CheckCircle size={12} className="text-emerald-500" />
            No setup required
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            <span className="text-zinc-900 dark:text-white">Start your first</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">analysis today</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-light mb-10 max-w-lg mx-auto leading-relaxed">
            Enter any compound name and let our multi-agent system deliver a complete repurposing intelligence report.
          </p>
          <ShaderButton onClick={handleStartAnalysis} className="h-14 px-12">
            Start Analysis
          </ShaderButton>
        </motion.div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/40 py-8 sm:py-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight mb-2">
                <Sparkles size={14} className="text-blue-500 dark:text-zinc-500" />
                Origin
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-xs leading-relaxed">
                Autonomous drug repurposing intelligence platform. Powered by multi-agent AI with 8 specialized research agents.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider text-[10px]">Product</h4>
                <div className="space-y-2">
                  <button onClick={() => navigate('/search')} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Search</button>
                  <button onClick={() => navigate('/compare')} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Compare</button>
                  <button onClick={() => navigate('/community')} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Community</button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider text-[10px]">Resources</h4>
                <div className="space-y-2">
                  <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">How it Works</button>
                  <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Features</button>
                  <button onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })} className="block text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider text-[10px]">Tip</h4>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-[10px] font-mono">⌘K</kbd> anywhere for quick navigation.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              © {new Date().getFullYear()} Origin. All rights reserved.
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Built with multi-agent AI.
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}

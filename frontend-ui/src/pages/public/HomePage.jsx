import { Link } from 'react-router-dom';
import { Droplets, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full mb-6">
        <Cpu className="w-4 h-4" /> Multi-Agent Decision Support System
      </div>

      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
        Next-Generation Water Grid Intelligence for <span className="text-sky-600">BAWASA</span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
        Autonomous sub-surface leak detection, Rawlsian distribution equity arbitration, and closed-loop field repair governance.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-6 py-3 rounded-xl transition shadow"
        >
          <span>Access System Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <Droplets className="w-8 h-8 text-sky-500 mb-3" />
          <h3 className="font-bold text-slate-900">Leak Detection (LDA)</h3>
          <p className="text-xs text-slate-600 mt-1">Random Forest classifier identifying pipeline ruptures in 15-second cycles.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-bold text-slate-900">Equity Evaluation (FEA)</h3>
          <p className="text-xs text-slate-600 mt-1">Rawlsian Relative Deprivation Index (RDI) tracking distribution fairness across Purok clusters.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <Cpu className="w-8 h-8 text-emerald-500 mb-3" />
          <h3 className="font-bold text-slate-900">Causal Arbitration (CA)</h3>
          <p className="text-xs text-slate-600 mt-1">Hydraulic DAG traversal suppressing false downstream alarms caused by upstream breaks.</p>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { THRESHOLDS } from '../../config/thresholds';
import { Clock, CheckCircle2, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

/**
 * VerificationTimer Component (Rule BR-07)
 * Monitors 15-minute post-repair quiescent flow and provides a demo fast-track trigger.
 */
export default function VerificationTimer({ 
  taskId, 
  nodeId, 
  pendingSince,
  onStatusChange 
}) {
  const checkVerification = useTaskStore((state) => state.checkVerification);
  const nodeState = useTelemetryStore((state) => state.getNode(nodeId));
  const currentFlow = Number(nodeState?.telemetry?.flow_rate_lpm) || 0.0;

  const totalWindow = THRESHOLDS.REPAIR_VERIFICATION_SECONDS || 900; // 15-minute window
  const quiescentFloor = THRESHOLDS.QUIESCENT_FLOW_FLOOR_LPM || 0.05; // 0.05 LPM seal floor
  const mechanicalFloor = THRESHOLDS.MECHANICAL_SENSOR_FLOOR_LPM || 1.0; // 1.0 LPM burst floor

  const calculateElapsed = () => {
    if (!pendingSince) return 0;
    const sinceEpoch = Math.floor(new Date(pendingSince).getTime() / 1000);
    const nowEpoch = Math.floor(Date.now() / 1000);
    return Math.max(0, nowEpoch - sinceEpoch);
  };

  const [elapsed, setElapsed] = useState(calculateElapsed());
  const [isEvaluating, setIsEvaluating] = useState(false);

  // 1. Tick 1 second timer locally
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, totalWindow - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progressPercent = Math.min(100, Math.round((elapsed / totalWindow) * 100));

  // 2. Verification Evaluator Action (Supports Demo Fast-Track)
  const handleEvaluateFlow = async (forceTimeWarp = false) => {
    setIsEvaluating(true);
    try {
      // If clicking "Verify Now", simulate that 900 seconds have elapsed
      const evalElapsed = forceTimeWarp ? 900 : elapsed;

      const res = await checkVerification(taskId, {
        current_flow_rate_lpm: currentFlow,
        elapsed_seconds: evalElapsed
      });

      if (res?.status && res.status !== 'PENDING_VERIFICATION') {
        if (onStatusChange) onStatusChange(res.status);
      }
    } catch (err) {
      console.error('[Evaluation Error]:', err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Auto-evaluate when time expires or if a burst occurs
  useEffect(() => {
    if (currentFlow >= mechanicalFloor) handleEvaluateFlow(false);
    if (elapsed >= totalWindow) handleEvaluateFlow(false);
  }, [currentFlow, elapsed]);

  const isQuiescent = currentFlow <= quiescentFloor;
  const isBurst = currentFlow >= mechanicalFloor;

  return (
    <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm space-y-4 font-sans select-none">
      
      {/* Header Bar + Demo Fast-Track Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Post-Repair Verification (Rule BR-07)</h4>
            <p className="text-[10px] text-slate-500">15-minute quiescent line observation window</p>
          </div>
        </div>

        {/* Demo Fast-Track Button */}
        <button
          onClick={() => handleEvaluateFlow(true)}
          disabled={isEvaluating}
          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-all active:scale-95 cursor-pointer"
          title="Simulate 15-minute passage for thesis demonstration"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>Verify Now (Demo)</span>
        </button>
      </div>

      {/* Counter & Flow Gauge Block */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Observation Timer</span>
          <span className="text-3xl font-black font-mono tracking-tight text-sky-400">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Observed Flow</span>
          <span className={`text-xl font-black font-mono ${
            isBurst ? 'text-rose-400 animate-pulse' : isQuiescent ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currentFlow.toFixed(2)} <span className="text-xs font-normal">LPM</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-sky-500 transition-all duration-1000 ease-linear rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0m (Start)</span>
          <span>{progressPercent}% Elapsed</span>
          <span>15m (Auto-Close)</span>
        </div>
      </div>

      {/* Status Messages */}
      {isBurst ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-bold">Verification Warning: Flow Recurrent (&ge; {mechanicalFloor} LPM)</strong>
            <p className="text-[11px] leading-relaxed text-rose-700">
              Last verification failed. Flow came back during the observation window. Re-check the seal and submit again.
            </p>
          </div>
        </div>
      ) : isQuiescent ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Flow is quiescent (&le; {quiescentFloor} LPM). Pipe seal holding pressure perfectly...</span>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Active flow detected ({currentFlow.toFixed(2)} LPM). Awaiting drop to quiescent floor...</span>
        </div>
      )}
    </div>
  );
}
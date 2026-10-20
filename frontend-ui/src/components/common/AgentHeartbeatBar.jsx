import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { rtdb } from '../../firebase/firebase_config';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';

export default function AgentHeartbeatBar() {
  function formatElapsedAge(sec) {
    if (sec === null || sec === undefined) return 'no signal';
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }
  const isConnected = useTelemetryStore((state) => state.isConnected);
  const heartbeats = useTelemetryStore((state) => state.heartbeats);
  const getSystemHealth = useTelemetryStore((state) => state.getSystemHealth);

  // 1-second live watchdog ticker so ageSeconds updates every second even if agents stop sending
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Re-evaluate system health every second against the 30s circuit breaker
  const systemHealth = getSystemHealth(nowSec);
  const agents = Object.values(systemHealth.agentDetails || {});

  // Manual Heartbeat Ping (Useful when testing UI without the Python agent daemon running)
  const handleSendHeartbeatPulse = async () => {
    setPulsing(true);
    const ts = Math.floor(Date.now() / 1000);
    try {
      await Promise.all([
        set(ref(rtdb, 'blackboard/heartbeats/CMP-LDA-01'), {
          agent_id: 'CMP-LDA-01',
          status: 'HEALTHY',
          timestamp: ts
        }),
        set(ref(rtdb, 'blackboard/heartbeats/CMP-FEA-01'), {
          agent_id: 'CMP-FEA-01',
          status: 'HEALTHY',
          timestamp: ts
        }),
        set(ref(rtdb, 'blackboard/heartbeats/CMP-CA-01'), {
          agent_id: 'CMP-CA-01',
          status: 'HEALTHY',
          timestamp: ts
        })
      ]);
      setNowSec(ts);
    } catch (err) {
      console.warn('[Watchdog] Failed to write heartbeat pulse:', err.message);
    } finally {
      setPulsing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-4">
      
      {/* Left: Overall Engine Liveness State */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl border ${
            systemHealth.overallStatus === 'HEALTHY'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : systemHealth.overallStatus === 'DEGRADED'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <Cpu className="w-4 h-4 stroke-[2]" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">
              MAS Multi-Agent Watchdog
            </span>

            {systemHealth.overallStatus === 'HEALTHY' ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> All Agents Active ({systemHealth.healthyCount}/{systemHealth.totalCount})
              </span>
            ) : systemHealth.overallStatus === 'DEGRADED' ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Degraded ({systemHealth.healthyCount}/{systemHealth.totalCount} Active)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Agents Offline (0/{systemHealth.totalCount} — &gt;30s Timeout)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            30.0s circuit breaker cutoff (FR-DSS-03) • 15.0s deliberation cycle
          </p>
        </div>
      </div>

      {/* Right: Individual Agent Heartbeat Chips + Live Age Counter + Hot Store Link */}
      <div className="flex flex-wrap items-center gap-2">
        {agents.map((agent) => {
          const ageText = formatElapsedAge(agent.ageSeconds);

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                agent.isAlive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
              title={`${agent.name} (${agent.id}) — Status: ${agent.status}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  agent.isAlive ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
              <span className="font-bold font-mono">{agent.short}</span>
              <span className="font-mono text-slate-700">
                {ageText}
              </span>
            </div>
          );
        })}

        {/* Manual Pulse Trigger if Agents are Offline */}
        {!systemHealth.isHealthy && (
          <button
            type="button"
            onClick={handleSendHeartbeatPulse}
            disabled={pulsing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-white text-xs font-semibold transition cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
            title="Broadcast a 30-second heartbeat pulse to Firebase for all 3 agents"
          >
            <Activity className="w-3.5 h-3.5 stroke-[2]" />
            <span>{pulsing ? 'Pulsing...' : 'Pulse Agents'}</span>
          </button>
        )}

        {/* Firebase RTDB WebSocket Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
            isConnected
              ? 'text-[#0c4a6e] bg-sky-50 border-sky-300'
              : 'text-slate-700 bg-slate-100 border-slate-300'
          }`}
          title={
            isConnected
              ? 'Firebase Realtime Database WebSocket Connected'
              : 'Disconnected from Firebase Hot Store'
          }
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-[#0c4a6e] stroke-[2]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-600 stroke-[2]" />
          )}
          <span className="font-mono">
            {isConnected ? 'RTDB Live' : 'RTDB Offline'}
          </span>
        </div>
      </div>

    </div>
  );
}
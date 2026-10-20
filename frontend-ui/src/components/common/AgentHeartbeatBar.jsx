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
    <div className="bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl p-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
      
      {/* Left: Overall Engine Liveness State */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl border ${
            systemHealth.overallStatus === 'HEALTHY'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : systemHealth.overallStatus === 'DEGRADED'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">
              MAS Multi-Agent Watchdog
            </span>

            {systemHealth.overallStatus === 'HEALTHY' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> All Agents Active ({systemHealth.healthyCount}/{systemHealth.totalCount})
              </span>
            ) : systemHealth.overallStatus === 'DEGRADED' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Degraded ({systemHealth.healthyCount}/{systemHealth.totalCount} Active)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3 h-3" /> Agents Offline (0/{systemHealth.totalCount} — &gt;30s Timeout)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition ${
                agent.isAlive
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-800'
              }`}
              title={`${agent.name} (${agent.id}) — Status: ${agent.status}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  agent.isAlive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span className="font-bold font-mono">{agent.short}</span>
              <span className="text-[10px] font-mono opacity-75">
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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition cursor-pointer shadow-2xs"
            title="Broadcast a 30-second heartbeat pulse to Firebase for all 3 agents"
          >
            <Activity className="w-3 h-3 text-sky-400" />
            <span>{pulsing ? 'Pulsing...' : 'Pulse Agents'}</span>
          </button>
        )}

        {/* Firebase RTDB WebSocket Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium ${
            isConnected
              ? 'text-sky-700 bg-sky-50 border-sky-200'
              : 'text-slate-400 bg-slate-50 border-slate-200'
          }`}
          title={
            isConnected
              ? 'Firebase Realtime Database WebSocket Connected'
              : 'Disconnected from Firebase Hot Store'
          }
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-sky-600" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="text-[11px] font-mono">
            {isConnected ? 'RTDB Live' : 'RTDB Offline'}
          </span>
        </div>
      </div>

    </div>
  );
}
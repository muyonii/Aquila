import React from 'react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { Cpu, CheckCircle2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export default function AgentHeartbeatBar() {
  const { heartbeats, isConnected, getSystemHealth } = useTelemetryStore();
  const systemHealth = getSystemHealth();
  const now = Math.floor(Date.now() / 1000);

  const agents = [
    { id: 'CMP-LDA-01', name: 'LDA', label: 'Leak Detection' },
    { id: 'CMP-FEA-01', name: 'FEA', label: 'Fairness Equity' },
    { id: 'CMP-CA-01',  name: 'CA',  label: 'Coordinator' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Left: Overall Engine State */}
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${systemHealth.isHealthy ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">MAS Multi-Agent Engine</span>
            {systemHealth.isHealthy ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> All Agents Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Degraded: {systemHealth.degradedAgents.join(', ')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Autonomous 15-second deliberation cycle (CMP-MAS-01)</p>
        </div>
      </div>

      {/* Right: Individual Agent Heartbeat Chips & Firebase Link */}
      <div className="flex items-center gap-2">
        {agents.map((agent) => {
          const pulse = heartbeats[agent.id];
          const isAlive = pulse && pulse.timestamp && (now - pulse.timestamp) <= 30 && pulse.status === 'HEALTHY';

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                isAlive 
                  ? 'bg-slate-50 border-slate-200 text-slate-700' 
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
              title={`${agent.label} (${agent.id})`}
            >
              <span className={`w-2 h-2 rounded-full ${isAlive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              <span className="font-bold">{agent.name}</span>
            </div>
          );
        })}

        {/* Hot Store Cloud Link */}
        <div 
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ml-2 ${
            isConnected ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-slate-400 bg-slate-50 border-slate-200'
          }`}
          title={isConnected ? 'Firebase Hot Store Connected' : 'Disconnected from Cloud Hot Store'}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5 text-sky-600" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[11px]">Hot Store</span>
        </div>
      </div>
    </div>
  );
}
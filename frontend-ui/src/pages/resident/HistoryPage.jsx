import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { residentApi } from '../../api/resident_api';
import { 
  History, 
  Calendar, 
  Waves, 
  TrendingUp, 
  Clock, 
  Table, 
  AlertTriangle 
} from 'lucide-react';

export default function HistoryPage() {
  const user = useAuthStore((state) => state.user);
  const assignedNodeId = user?.assigned_node_id;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setIsLoading(true);
        const res = await residentApi.getMyWater();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to fetch usage history.');
      } finally {
        setIsLoading(false);
      }
    }

    if (assignedNodeId) fetchHistory();
  }, [assignedNodeId]);

  const history = data?.history || [];
  const totalLiters = Number(data?.total_24h_liters) || 0;
  const totalM3 = Number(data?.total_24h_m3) || (totalLiters / 1000);

  // Calculate Peak Consumption Hour & Averages
  const peakRecord = history.reduce((prev, curr) => {
    return (Number(curr.total_volume_liters) > Number(prev?.total_volume_liters || 0)) ? curr : prev;
  }, null);

  const avgHourlyLiters = history.length > 0 ? (totalLiters / history.length) : 0;
  const maxBarValue = Math.max(...history.map(h => Number(h.total_volume_liters) || 0), 10);

  // Format timestamps nicely (e.g. "17:00")
  const formatHour = (ts) => {
    if (!ts) return '--:--';
    const parts = ts.split(' ');
    return parts[1] ? parts[1].slice(0, 5) : ts;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">24-Hour Consumption History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archival hourly summaries for meter <span className="font-mono font-bold text-slate-700">{assignedNodeId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Last 24 Hours</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading historical data...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>
      ) : (
        <>
          {/* 2. Analytical Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">24h Cumulative Liters</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">{totalLiters.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-500">Liters</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold text-sky-600 uppercase">Billing Volume</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-sky-900 font-mono">{totalM3.toFixed(3)}</span>
                <span className="text-xs font-bold text-sky-700">m³</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold text-amber-600 uppercase">Peak Consumption Hour</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-slate-800 font-mono">
                  {peakRecord ? `${formatHour(peakRecord.hour_timestamp)}` : '--:--'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({peakRecord ? Number(peakRecord.total_volume_liters).toFixed(1) : 0} L)
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-semibold text-emerald-600 uppercase">Hourly Average</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-800 font-mono">{avgHourlyLiters.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-500">L / hr</span>
              </div>
            </div>
          </div>

          {/* 3. Pure CSS Hourly Consumption Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600" /> Hourly Consumption Profile
            </h3>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No hourly compaction records available yet.</div>
            ) : (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
                  {history.slice(-24).map((row, idx) => {
                    const liters = Number(row.total_volume_liters) || 0;
                    const heightPercent = Math.max(4, Math.round((liters / maxBarValue) * 100));

                    return (
                      <div key={idx} className="flex-1 min-w-[24px] flex flex-col items-center gap-1 group relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-7 bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                          {liters.toFixed(1)} L
                        </div>

                        {/* Bar */}
                        <div 
                          className="w-full bg-sky-500 hover:bg-sky-600 rounded-t transition" 
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span>{history[0] ? formatHour(history[0].hour_timestamp) : '24h ago'}</span>
                  <span>12h ago</span>
                  <span>{history[history.length - 1] ? formatHour(history[history.length - 1].hour_timestamp) : 'Now'}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Tabular Hourly Summary Records */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-400" /> Hourly Compaction Audit Table
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{history.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 pl-4">Hour Timestamp</th>
                    <th className="p-3">Volume (Liters)</th>
                    <th className="p-3">Peak Flow Rate</th>
                    <th className="p-3">Meter Index</th>
                    <th className="p-3 pr-4 text-right">Alarms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.map((row) => (
                    <tr key={row.summary_id || row.hour_timestamp} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 pl-4 font-mono font-medium text-slate-900">{row.hour_timestamp}</td>
                      <td className="p-3 font-mono font-bold text-sky-700">{Number(row.total_volume_liters).toFixed(2)} L</td>
                      <td className="p-3 font-mono">{Number(row.peak_flow_rate_lpm).toFixed(2)} LPM</td>
                      <td className="p-3 font-mono text-slate-500">{Number(row.cumulative_meter_reading || 0).toFixed(1)} L</td>
                      <td className="p-3 pr-4 text-right">
                        {Number(row.leak_flag_count) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                            <AlertTriangle className="w-3 h-3" /> {row.leak_flag_count}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
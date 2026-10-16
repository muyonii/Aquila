import StatusBadge from '../../components/common/StatusBadge';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../../stores/useTaskStore';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';

export default function MyTasksPage() {
  const { tasks, fetchMyTasks, isLoading, error, isOnDuty, toggleDutyStatus } = useTaskStore();
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const dispatchedCount = tasks.filter((t) => t.status === 'DISPATCHED').length;
  const verifyingCount = tasks.filter((t) => t.status === 'PENDING_VERIFICATION').length;
  const failedCount = tasks.filter((t) => t.status === 'REPAIR_FAILED').length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-4">
      {/* 1. Header & Duty Status Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 leading-tight">Assigned Work Orders</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {tasks.length} active jobs in queue
          </p>
        </div>

        {/* Duty Toggle Button */}
        <button
          onClick={toggleDutyStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            isOnDuty 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>{isOnDuty ? 'On Duty' : 'Off Duty'}</span>
        </button>
      </div>

      {!isOnDuty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You are marked <strong>Off Duty</strong>. New emergency dispatches will not ring on your device.</span>
        </div>
      )}

      {/* 2. Status Filter Tabs */}
      <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs overflow-x-auto">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
            filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilterStatus('DISPATCHED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1 ${
            filterStatus === 'DISPATCHED' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Dispatched</span>
          {dispatchedCount > 0 && (
            <span className="bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {dispatchedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilterStatus('PENDING_VERIFICATION')}
          className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1 ${
            filterStatus === 'PENDING_VERIFICATION' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Verifying</span>
          {verifyingCount > 0 && (
            <span className="bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {verifyingCount}
            </span>
          )}
        </button>
        {failedCount > 0 && (
          <button
            onClick={() => setFilterStatus('REPAIR_FAILED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1 ${
              filterStatus === 'REPAIR_FAILED' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-700'
            }`}
          >
            <span>Failed ({failedCount})</span>
          </button>
        )}
      </div>

      {/* 3. Task Cards Feed */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading work orders...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchMyTasks()} className="underline font-bold">Retry</button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Pending Tasks</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filterStatus === 'ALL' 
              ? 'All clear! There are currently no work orders assigned to you.' 
              : `No tasks found in status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isP1 = task.severity_level === 'P1';
            const isPendingVerif = task.status === 'PENDING_VERIFICATION';
            const isFailed = task.status === 'REPAIR_FAILED';

            const mapsUrl = task.latitude && task.longitude 
              ? `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`
              : null;

            return (
              <div
                key={task.incident_id}
                className={`bg-white p-4 rounded-2xl border transition shadow-sm ${
                  isP1 
                    ? 'border-rose-300 ring-1 ring-rose-100' 
                    : isPendingVerif
                    ? 'border-sky-300 ring-1 ring-sky-100'
                    : isFailed
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={task.severity_level} />
                      <StatusBadge status={task.status} />
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      #{task.incident_id.slice(0, 8)}
                    </span>
                  </div>

                <div className="mb-3">
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {task.household_label || task.node_id}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {task.purok_cluster || 'Purok 2'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-700">{task.node_id}</span>
                  </div>

                  {task.repair_notes && (
                    <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg line-clamp-2">
                      {task.repair_notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>GPS Route</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No GPS coords</span>
                  )}

                  <Link
                    to={`/tasks/${task.incident_id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      isPendingVerif
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : isP1
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isPendingVerif ? 'View Timer' : 'Inspect & Repair'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
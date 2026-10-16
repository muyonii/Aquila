import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { residentApi } from '../../api/resident_api';

// Shared IoT Widgets
import SvgNeedleGauge from '../../components/gauges/SvgNeedleGauge';
import FlowSparkline from '../../components/gauges/FlowSparkline';
import BatteryIndicator from '../../components/gauges/BatteryIndicator';

import { 
  Droplets, 
  Gauge, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  Waves
} from 'lucide-react';

export default function WaterUsagePage() {
  const user = useAuthStore((state) => state.user);
  const assignedNodeId = user?.assigned_node_id;

  // Real-Time Telemetry Store
  const { getNode, isNodeStale } = useTelemetryStore();
  const nodeState = getNode(assignedNodeId);
  const telemetry = nodeState?.telemetry;
  const history = nodeState?.history || [];
  const leakHypothesis = nodeState?.leak;

  // Cold Relational Data (MySQL 24h Aggregates)
  const [coldData, setColdData] = useState(null);
  const [isLoadingCold, setIsLoadingCold] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWaterData() {
      try {
        setIsLoadingCold(true);
        const res = await residentApi.getMyWater();
        if (isMounted) {
          setColdData(res.data);
          setFetchError(null);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.response?.data?.error?.message || 'Failed to load household summary.');
        }
      } finally {
        if (isMounted) setIsLoadingCold(false);
      }
    }

    if (assignedNodeId) {
      loadWaterData();
    }
    return () => { isMounted = false; };
  }, [assignedNodeId]);

  // Derived Values
  const currentFlowLpm = Number(telemetry?.flow_rate_lpm) || 0.0;
  const totalLiters24h = Number(coldData?.total_24h_liters) || 0.0;
  const totalCubicMeters24h = Number(coldData?.total_24h_m3) || (totalLiters24h / 1000);
  const batteryVolts = Number(telemetry?.battery_voltage) || 4.10;
  const isStale = isNodeStale(assignedNodeId);
  const isCriticalLeak = leakHypothesis?.classification === 'LEAK';

  // Determine Supply Status Badge
  const getSupplyStatus = () => {
    if (isCriticalLeak) {
      return {
        label: 'Continuous Draw / Leak Advisory',
        description: 'Abnormal continuous flow detected by BAWASA. Check household faucets.',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: ShieldAlert
      };
    }
    if (isStale) {
      return {
        label: 'Sensor Idle / Low Signal',
        description: 'Waiting for fresh telemetry pulse from the water meter.',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle
      };
    }
    if (currentFlowLpm > 0.05) {
      return {
        label: 'Water In Use',
        description: 'Active domestic consumption detected at your meter.',
        color: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Activity
      };
    }
    return {
      label: 'Supply Normal & Stable',
      description: 'Pipeline pressure optimal. No water is currently running.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    };
  };

  const status = getSupplyStatus();
  const StatusIcon = status.icon;

  if (!assignedNodeId) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h2 className="text-base font-bold text-amber-900">Unassigned Account</h2>
        <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
          Your account is not yet bound to a physical or synthetic monitoring node. Please contact the BAWASA administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Household Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            {coldData?.purok_cluster || 'Purok 2'} Cluster
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            {coldData?.household_label || 'Household Meter'}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Node ID: <span className="font-bold text-slate-700">{assignedNodeId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <BatteryIndicator voltage={batteryVolts} />
        </div>
      </div>

      {/* 2. Supply Status Card */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${status.color}`}>
        <StatusIcon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-xs font-bold">{status.label}</h3>
          <p className="text-xs opacity-90 mt-0.5">{status.description}</p>
        </div>
      </div>

      {/* 3. Main Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Real-Time Flow Rate Dial */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600" /> Live Flow Velocity
            </span>
            <span className="text-[10px] text-slate-400 font-mono">15s update rate</span>
          </div>

          <div className="py-2">
            <SvgNeedleGauge 
              value={currentFlowLpm} 
              max={10.0} 
              size={220} 
              label="Instantaneous Rate" 
            />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Flow Classification:</span>
            <span className="font-semibold text-slate-800">
              {currentFlowLpm <= 0.05 ? 'Quiescent (Still)' : currentFlowLpm <= 4.5 ? 'Normal Domestic' : 'High Flow'}
            </span>
          </div>
        </div>

        {/* Right: 24-Hour Consumption Aggregate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-sky-600" /> 24-Hour Volume
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Hourly Compacted
              </span>
            </div>

            <div className="space-y-4">
              {/* Primary Liters Volume Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Water Consumed</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {isLoadingCold ? '...' : totalLiters24h.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-500">Liters</span>
                </div>
              </div>

              {/* Cubic Meters Conversion */}
              <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-100">
                <span className="text-[11px] font-semibold text-sky-700 uppercase">Cubic Meters (m³) for Billing</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-sky-900 font-mono">
                    {isLoadingCold ? '...' : totalCubicMeters24h.toFixed(3)}
                  </span>
                  <span className="text-xs font-bold text-sky-700">m³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sparkline Trend */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-500 font-medium">Recent 15s Flow Trend</span>
              <span className="text-slate-400 font-mono">{history.length} packets</span>
            </div>
            <div className="w-full flex justify-center">
              <FlowSparkline data={history} height={42} isLeak={isCriticalLeak} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Help & Issue CTA */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" /> Experiencing Water Issues?
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Report line leaks, zero pressure, or request pipe maintenance directly to BAWASA technicians.
          </p>
        </div>

        <Link
          to="/my-reports"
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <span>Report an Issue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
// frontend-ui/src/pages/admin/incidents/core/IncidentModel.js

export class IncidentModel {
  constructor(data = {}) {
    this.id = data.incident_id || '';
    this.nodeId = data.node_id || '';
    this.householdLabel = data.household_label || 'Unnamed Household';
    this.purokCluster = data.purok_cluster || 'Purok 2';
    this.type = data.incident_type || 'CRITICAL_LEAK';
    this.severity = data.severity_level || 'P1';
    this.status = data.status || 'OPEN'; // 'OPEN' | 'DISPATCHED' | 'PENDING_VERIFICATION' | 'CLOSED_VERIFIED' | 'REPAIR_FAILED' | 'CANCELLED'
    this.actionTitle = data.action_card_title || 'Suspected Pipe Rupture';
    this.actionDirective = data.action_directive || `Inspect conduit branch at ${this.nodeId}. Check meter couplings.`;
    this.technicianId = data.assigned_technician_id || null;
    this.technicianName = data.assigned_technician_name || null;
    this.detectedAt = data.detected_at || new Date().toISOString();
    this.verifiedAt = data.verified_at || null;
    this.pendingVerificationSince = data.pending_verification_since || null;
    this.resolvedAt = data.resolved_at || null;
    this.repairNotes = data.repair_notes || '';
    
    // Physical flow loss rate estimate (L/min)
    this.flowRateLpm = Number(data.flow_rate_lpm) || (this.severity === 'P1' ? 4.82 : this.severity === 'P2' ? 1.45 : 0.85);
  }

  isCritical() {
    return this.severity === 'P1';
  }

  isOpen() {
    return this.status === 'OPEN';
  }

  isDispatched() {
    return this.status === 'DISPATCHED';
  }

  isVerifying() {
    return this.status === 'PENDING_VERIFICATION';
  }

  isResolved() {
    return this.status === 'CLOSED_VERIFIED' || this.status === 'CANCELLED';
  }

  getReadableType() {
    switch (this.type) {
      case 'CRITICAL_LEAK':
        return 'Pipe Rupture';
      case 'FAIRNESS_DEFICIT':
        return 'Low Water Deficit';
      case 'SUSPICIOUS_USAGE':
        return 'Suspicious Draw';
      default:
        return this.type;
    }
  }

  getElapsedTime() {
    if (!this.detectedAt) return 'Just now';
    const past = new Date(this.detectedAt).getTime();
    const diffSec = Math.max(0, Math.floor((Date.now() - past) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  getSeverityBadgeProps() {
    switch (this.severity) {
      case 'P1':
        return { label: 'P1 Urgent', className: 'bg-black/[0.06] text-slate-900 border-black/[0.1] font-bold' };
      case 'P2':
        return { label: 'P2 Deficit', className: 'bg-black/[0.04] text-slate-700 border-black/[0.06] font-medium' };
      case 'P3':
        return { label: 'P3 Minor', className: 'bg-black/[0.02] text-slate-500 border-black/[0.04] font-medium' };
      default:
        return { label: this.severity, className: 'bg-black/[0.03] text-slate-600 border-black/[0.06]' };
    }
  }

  getStatusBadgeProps() {
    switch (this.status) {
      case 'OPEN':
        return { label: 'Needs Dispatch', className: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold' };
      case 'DISPATCHED':
        return { label: 'Plumber Dispatched', className: 'bg-black/[0.04] text-slate-700 border-black/[0.06]' };
      case 'PENDING_VERIFICATION':
        return { label: '15m Verification Active', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'CLOSED_VERIFIED':
        return { label: 'Resolved (Verified)', className: 'bg-black/[0.02] text-slate-400 border-black/[0.04]' };
      case 'REPAIR_FAILED':
        return { label: 'Repair Failed', className: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'CANCELLED':
        return { label: 'Dismissed', className: 'bg-black/[0.02] text-slate-400 border-black/[0.04]' };
      default:
        return { label: this.status, className: 'bg-black/[0.03] text-slate-600 border-black/[0.06]' };
    }
  }

  matches(query = '', filter = 'all') {
    if (filter === 'needs_dispatch' && !this.isOpen()) return false;
    if (filter === 'verifying' && !this.isVerifying()) return false;
    if (filter === 'dispatched' && !this.isDispatched()) return false;
    if (filter === 'resolved' && !this.isResolved()) return false;

    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      this.nodeId.toLowerCase().includes(q) ||
      this.householdLabel.toLowerCase().includes(q) ||
      this.id.toLowerCase().includes(q) ||
      this.purokCluster.toLowerCase().includes(q) ||
      (this.technicianName && this.technicianName.toLowerCase().includes(q))
    );
  }
}
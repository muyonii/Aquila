import { axiosClient } from './axios_client';

export const adminApi = {
  // ===========================================================================
  // 1. ANALYTICS & CLUSTER OVERVIEW
  // ===========================================================================
  /**
   * GET /api/v1/analytics/summary
   * Fetches total node counts, past 24h community water volume, and incident breakdown.
   */
  async getClusterSummary() {
    const response = await axiosClient.get('/analytics/summary');
    return response.data; // { success: true, data: { total_nodes, community_24h_liters, nodes, incident_breakdown } }
  },

  // ===========================================================================
  // 2. INCIDENTS & DISPATCH MANAGEMENT
  // ===========================================================================
  /**
   * GET /api/v1/incidents
   * Fetches all work orders ordered by status and priority.
   */
  async getIncidents() {
    const response = await axiosClient.get('/incidents');
    return response.data; // { success: true, data: [ ...incidents ] }
  },

  /**
   * GET /api/v1/incidents/{id}
   * Fetches full ticket details along with its chronological audit trail.
   */
  async getIncidentDetails(incidentId) {
    const response = await axiosClient.get(`/incidents/${incidentId}`);
    return response.data; // { success: true, data: { incident, audit_trail } }
  },

  /**
   * POST /api/v1/incidents
   * Logs a manual citizen walk-in complaint from the BAWASA municipal hall.
   * @param {Object} payload - { node_id, incident_type, severity_level, complaint_notes }
   */
  async createManualIncident(payload) {
    const response = await axiosClient.post('/incidents', payload);
    return response.data;
  },

  /**
   * POST /api/v1/incidents/{id}/dispatch
   * Dispatches a field technician to an active incident.
   * @param {string} incidentId
   * @param {number} technicianId - User ID of the technician
   */
  async dispatchTechnician(incidentId, technicianId) {
    const response = await axiosClient.post(`/incidents/${incidentId}/dispatch`, {
      technician_id: Number(technicianId)
    });
    return response.data;
  },

  /**
   * PATCH /api/v1/incidents/{id}/cancel
   * Dismisses an incident as a verified false alarm.
   * @param {string} incidentId
   * @param {string} cancellationReason
   */
  async cancelIncident(incidentId, cancellationReason) {
    const response = await axiosClient.patch(`/incidents/${incidentId}/cancel`, {
      cancellation_reason: cancellationReason
    });
    return response.data;
  },

  // ===========================================================================
  // 3. NODE TOPOLOGY & PROVISIONING (PHYSICAL ESP32 & SIMULATED)
  // ===========================================================================
  /**
   * GET /api/v1/nodes
   * Retrieves all monitoring nodes, GPS coordinates, and DAG parent relationships.
   */
  async getNodes() {
    const response = await axiosClient.get('/nodes');
    return response.data; // { success: true, data: { total_nodes, nodes: [] } }
  },

  /**
   * POST /api/v1/nodes
   * Provisions a new node and syncs initial ACTIVE state to Firebase RTDB.
   * @param {Object} nodeData - { node_id, household_label, purok_cluster, parent_node_id, latitude, longitude, is_physical }
   */
  async createNode(nodeData) {
    const response = await axiosClient.post('/nodes', nodeData);
    return response.data; // { success: true, data: { ...node, device_token } }
  },

  /**
   * PUT /api/v1/nodes/{id}
   * Updates node metadata or toggles status ('ACTIVE', 'MAINTENANCE', 'INACTIVE').
   * Syncs status update to Firebase to suppress false AI alarms during repairs.
   */
  async updateNode(nodeId, updateData) {
    const response = await axiosClient.put(`/nodes/${nodeId}`, updateData);
    return response.data;
  },

  /**
   * DELETE /api/v1/nodes/{id}
   * Decommissions an infrastructure node.
   */
  async deleteNode(nodeId) {
    const response = await axiosClient.delete(`/nodes/${nodeId}`);
    return response.data;
  },

  // ===========================================================================
  // 4. REPORTS, EQUITY ANALYTICS & CSV STREAMING
  // ===========================================================================
  /**
   * GET /api/v1/reports/consumption
   * Calculates volumetric distribution and Rawlsian Relative Deprivation Index (RDI).
   */
  async getConsumptionReport(params = {}) {
    const response = await axiosClient.get('/reports/consumption', { params });
    return response.data;
  },

  /**
   * GET /api/v1/reports/leaks
   * Evaluates Non-Revenue Water (NRW) physical water lost and Mean Time to Repair (MTTR).
   */
  async getLeakLossReport(params = {}) {
    const response = await axiosClient.get('/reports/leaks', { params });
    return response.data;
  },

  /**
   * GET /api/v1/reports/maintenance
   * Summarizes technician job completion and failed verification rates.
   */
  async getMaintenanceReport() {
    const response = await axiosClient.get('/reports/maintenance');
    return response.data;
  },

  /**
   * GET /api/v1/reports/export?type=consumption|leaks
   * Downloads memory-safe streaming CSV report directly to the browser.
   * @param {'consumption' | 'leaks'} type
   */
  async downloadReportCsv(type = 'consumption') {
    const response = await axiosClient.get(`/reports/export?type=${type}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `AQUILA_${type.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // ===========================================================================
  // 5. USER MANAGEMENT & GOVERNANCE
  // ===========================================================================
  /**
   * GET /api/v1/users
   * Retrieves user accounts, optionally filtered by role ('admin', 'technician', 'resident').
   */
  async getUsers(role = null) {
    const params = role ? { role } : {};
    const response = await axiosClient.get('/users', { params });
    return response.data; // { success: true, data: { total_users, users: [] } }
  },

  /**
   * POST /api/v1/users
   * Creates an account with bcrypt hashing and resident-node verification (INV-05).
   * @param {Object} userData - { full_name, email, password, role, assigned_node_id }
   */
  async createUser(userData) {
    const response = await axiosClient.post('/users', userData);
    return response.data;
  },

  /**
   * PUT /api/v1/users/{id}
   * Updates user credentials, role, or meter binding (with last-admin demotion guard).
   */
  async updateUser(userId, userData) {
    const response = await axiosClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  /**
   * DELETE /api/v1/users/{id}
   * Deletes user account (prevents self-deletion and last-admin deletion).
   */
  async deleteUser(userId) {
    const response = await axiosClient.delete(`/users/${userId}`);
    return response.data;
  },

  // ===========================================================================
  // 6. IMMUTABLE AUDIT LEDGER (INV-06)
  // ===========================================================================
  /**
   * GET /api/v1/audit-logs
   * Retrieves the latest 50 append-only immutable audit trail records.
   */
  async getAuditLogs() {
    const response = await axiosClient.get('/audit-logs');
    return response.data; // { success: true, data: { total_records, audit_logs: [] } }
  }
};
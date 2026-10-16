import { axiosClient } from './axios_client';

export const residentApi = {
  /**
   * GET /api/v1/resident/my-water
   * Fetches household metadata, 24-hour total volume (L and m3),
   * and historical hourly summary rows for the assigned meter.
   * Row-Level Security (INV-05) is enforced server-side.
   */
  async getMyWater() {
    const response = await axiosClient.get('/resident/my-water');
    return response.data; // { success: true, data: { node_id, household_label, total_24h_liters, total_24h_m3, history: [] } }
  },

  /**
   * GET /api/v1/incidents
   * When requested by a resident, the backend automatically filters
   * tickets where node_id = assigned_node_id.
   */
  async getMyIncidents() {
    const response = await axiosClient.get('/incidents');
    return response.data; // { success: true, data: [ ...tickets ] }
  },

  /**
   * POST /api/v1/incidents
   * Submit a citizen complaint/ticket for the resident's assigned meter.
   * @param {Object} payload - { node_id, incident_type, severity_level, complaint_notes }
   */
  async reportIssue(payload) {
    const response = await axiosClient.post('/incidents', payload);
    return response.data;
  }
};
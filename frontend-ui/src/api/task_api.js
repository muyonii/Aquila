import { axiosClient } from './axios_client';

export const taskApi = {
  /**
   * GET /api/v1/tasks
   * Fetches active assigned tasks (DISPATCHED, PENDING_VERIFICATION, REPAIR_FAILED)
   * for the authenticated technician.
   */
  async getMyTasks() {
    const response = await axiosClient.get('/tasks');
    return response.data; // { success: true, data: { active_tasks, tasks: [...] } }
  },

  /**
   * GET /api/v1/tasks/{id}
   * Fetches full task detail, node coordinates (lat, lng), and action card directive.
   * @param {string} taskId - Canonical UUIDv4
   */
  async getTaskDetails(taskId) {
    const response = await axiosClient.get(`/tasks/${taskId}`);
    return response.data; // { success: true, data: { ...task } }
  },

  /**
   * PATCH /api/v1/tasks/{id}/repair
   * Submits repair notes and initiates the 15-minute verification window (BR-07).
   * Status transitions to PENDING_VERIFICATION.
   * @param {string} taskId
   * @param {string} repairNotes
   */
  async submitRepair(taskId, repairNotes) {
    const response = await axiosClient.patch(`/tasks/${taskId}/repair`, {
      repair_notes: repairNotes
    });
    return response.data;
  },

  /**
   * POST /api/v1/incidents/{id}/verify-flow
   * Evaluates if flow rate remained quiescent (<= 0.05 LPM) for 900 seconds.
   * @param {string} taskId
   * @param {Object} [evalData] - Optional: { current_flow_rate_lpm, elapsed_seconds }
   */
  async verifyFlow(taskId, evalData = {}) {
    const response = await axiosClient.post(`/incidents/${taskId}/verify-flow`, evalData);
    return response.data; // { success: true, data: { status, observed_lpm, remaining_seconds } }
  }
};
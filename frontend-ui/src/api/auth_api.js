import { axiosClient } from './axios_client.js';

export const authApi = {
  /**
   * POST /api/v1/auth/login
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const response = await axiosClient.post('/auth/login', { email, password });
    return response.data; // { success: true, data: { token, user, expires_in } }
  },

  /**
   * GET /api/v1/auth/me (Session restore on reload)
   */
  async getMe() {
    const response = await axiosClient.get('/auth/me');
    return response.data; // { success: true, data: user }
  },

  /**
   * POST /api/v1/auth/change-password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  async changePassword(currentPassword, newPassword) {
    const response = await axiosClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  }
};
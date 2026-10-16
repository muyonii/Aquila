import { create } from 'zustand';
import { taskApi } from '../api/task_api';

export const useTaskStore = create((set, get) => ({
  // 1. State
  tasks: [],
  activeTask: null,
  isLoading: false,
  error: null,
  isOnDuty: JSON.parse(localStorage.getItem('aquila_tech_on_duty') ?? 'true'),
  
  // Verification states map: { [taskId]: { status, remainingSeconds, observedLpm } }
  verificationStates: {},

  // 2. Actions
  
  /**
   * Fetch active work orders for logged-in technician
   */
  fetchMyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await taskApi.getMyTasks();
      const taskList = res.data?.tasks || [];
      set({ tasks: taskList, isLoading: false });
      return taskList;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to load assigned tasks.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Fetch a single task by ID
   */
  fetchTaskDetails: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await taskApi.getTaskDetails(taskId);
      const task = res.data;
      set({ activeTask: task, isLoading: false });
      return task;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to load task details.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Submit technician repair notes
   */
  submitRepair: async (taskId, repairNotes) => {
    set({ isLoading: true, error: null });
    try {
      const res = await taskApi.submitRepair(taskId, repairNotes);
      
      // Update local state to PENDING_VERIFICATION
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t.incident_id === taskId 
            ? { ...t, status: 'PENDING_VERIFICATION' } 
            : t
        ),
        activeTask: state.activeTask?.incident_id === taskId 
          ? { ...state.activeTask, status: 'PENDING_VERIFICATION' } 
          : state.activeTask,
        isLoading: false
      }));

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit repair.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Evaluate quiescent flow during 15-minute verification (BR-07)
   */
  checkVerification: async (taskId, evalData = {}) => {
    try {
      const res = await taskApi.verifyFlow(taskId, evalData);
      const { status, observed_lpm, remaining_seconds } = res.data;

      // Update timer state
      set((state) => ({
        verificationStates: {
          ...state.verificationStates,
          [taskId]: {
            status,
            observedLpm: observed_lpm,
            remainingSeconds: remaining_seconds ?? 0
          }
        }
      }));

      // If the ticket reached a terminal state (CLOSED_VERIFIED or REPAIR_FAILED), update task lists
      if (status === 'CLOSED_VERIFIED' || status === 'REPAIR_FAILED') {
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.incident_id === taskId ? { ...t, status } : t
          ),
          activeTask: state.activeTask?.incident_id === taskId 
            ? { ...state.activeTask, status } 
            : state.activeTask
        }));
      }

      return res.data;
    } catch (err) {
      console.error(`[Verification Error] Failed for task ${taskId}:`, err.message);
      throw err;
    }
  },

  /**
   * Toggle on/off duty status
   */
  toggleDutyStatus: () => {
    set((state) => {
      const nextStatus = !state.isOnDuty;
      localStorage.setItem('aquila_tech_on_duty', JSON.stringify(nextStatus));
      return { isOnDuty: nextStatus };
    });
  },

  /**
   * Reset store on logout
   */
  resetTaskStore: () => {
    set({
      tasks: [],
      activeTask: null,
      isLoading: false,
      error: null,
      verificationStates: {}
    });
  }
}));
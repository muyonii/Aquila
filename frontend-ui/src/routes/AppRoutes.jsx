// frontend-ui/src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import TechLayout from '../layouts/TechLayout';
import ResidentLayout from '../layouts/ResidentLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';

// Admin Pages
import DashboardPage from '../pages/admin/dashboard/DashboardPage';
import IncidentsPage from '../pages/admin/incidents/IncidentsPage';
import NetworkMapPage from '../pages/admin/network-map/NetworkMapPage';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import UsersPage from '../pages/admin/users/UsersPage';
import AdminSettingsPage from '../pages/admin/settings/AdminSettingsPage';

// Technician Pages
import MyTasksPage from '../pages/technician/MyTasksPage';
import TaskDetailPage from '../pages/technician/TaskDetailPage';
import MapPage from '../pages/technician/MapPage';
import ProfilePage from '../pages/technician/ProfilePage';

// Resident Pages
import WaterUsagePage from '../pages/resident/WaterUsagePage';
import ReportIssuePage from '../pages/resident/ReportIssuePage';
import HistoryPage from '../pages/resident/HistoryPage';
import SettingsPage from '../pages/resident/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Login Route (No Header / Navbar) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* 1. Public Visitor Routes (Uses PublicLayout Header) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* 2. Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        {/* Full-screen Standalone Settings Shell */}
        <Route path="/settings" element={<AdminSettingsPage />} />

        {/* Dashboard Shell with Sidebar */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/network-map" element={<NetworkMapPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      {/* 3. Technician Routes */}
      <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
        <Route element={<TechLayout />}>
          <Route path="/tasks" element={<MyTasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 4. Resident Routes */}
      <Route element={<ProtectedRoute allowedRoles={['resident']} />}>
        <Route element={<ResidentLayout />}>
          <Route path="/usage" element={<WaterUsagePage />} />
          <Route path="/my-reports" element={<ReportIssuePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/account" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
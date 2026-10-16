// src/pages/admin/users/UsersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { userManager } from './core/UserManager';
import { UserFilterCriteria } from './core/UserFilterCriteria';

import UserHeader from './components/UserHeader';
import UserKpiCards from './components/UserKpiCards';
import UserFilterBar from './components/UserFilterBar';
import UserTable from './components/UserTable';
import UserInspectorDrawer from './components/UserInspectorDrawer';
import AddUserModal from './components/AddUserModal';

export default function UsersPage() {
  const [data, setData] = useState({ users: [], nodes: [] });
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    const res = await userManager.loadAll();
    setData(res);
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedUser(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const kpis = useMemo(() => {
    return userManager.computeKpis(data.users);
  }, [data.users]);

  const filteredUsers = useMemo(() => {
    const criteria = new UserFilterCriteria(roleFilter, search);
    return userManager.filter(data.users, criteria);
  }, [data.users, roleFilter, search]);

  const handleCreateUser = async (formPayload) => {
    setSubmitting(true);
    try {
      await userManager.createUser({
        full_name: formPayload.full_name,
        email: formPayload.email,
        password: formPayload.password,
        role: formPayload.role,
        assigned_node_id: formPayload.role === 'resident' ? formPayload.assigned_node_id : null
      });
      setIsAddModalOpen(false);
      reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm('Reset password to default: "Password123!"?')) return;
    try {
      await userManager.resetPassword(userId);
      alert('Password reset successfully to Password123!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (userId, userRole) => {
    if (userRole === 'admin' && kpis.admins <= 1) {
      alert('Safety Guardrail: Cannot delete the sole remaining administrator account.');
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this account?')) return;
    try {
      await userManager.deleteUser(userId);
      setSelectedUser(null);
      reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="min-h-full bg-[#f4f5f8] text-[#1d1d1f] p-6 sm:p-10 space-y-8 select-none relative font-sans">
      <UserHeader onAddUserClick={() => setIsAddModalOpen(true)} />

      <UserKpiCards kpis={kpis} />

      <UserFilterBar
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        search={search}
        onSearchChange={setSearch}
        counts={{
          total: kpis.total,
          residents: data.users.filter((u) => u.role === 'resident').length,
          techs: kpis.techs,
          admins: kpis.admins
        }}
      />

      <UserTable
        users={filteredUsers}
        selectedUserId={selectedUser?.user_id}
        onSelectUser={setSelectedUser}
      />

      <UserInspectorDrawer
        user={selectedUser}
        adminCount={kpis.admins}
        onClose={() => setSelectedUser(null)}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        nodes={data.nodes}
        onSubmit={handleCreateUser}
        submitting={submitting}
      />
    </div>
  );
}
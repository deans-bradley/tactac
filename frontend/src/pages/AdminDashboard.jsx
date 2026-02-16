import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { LoadingSpinner, Button, Modal, Input } from '../components/common';
import { Users, Image, MessageSquare, Heart, Search, MoreHorizontal, Ban, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'metrics') {
      loadMetrics();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, page, statusFilter]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMetrics();
      setMetrics(response.data.data.metrics);
    } catch (error) {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(page, 20, searchQuery, statusFilter);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleUserAction = async (userId, action, value) => {
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await adminApi.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        setShowUserModal(false);
        toast.success('User deleted');
      } else if (action === 'status') {
        await adminApi.updateUser(userId, { status: value });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: value } : u));
        toast.success(`User ${value}`);
      } else if (action === 'role') {
        await adminApi.updateUser(userId, { role: value });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: value } : u));
        toast.success('User role updated');
      }
    } catch (error) {
      toast.error(error.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const MetricCard = ({ icon: Icon, label, value, subValue, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Users
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" size="lg" />
      ) : (
        <>
          {/* Metrics Tab */}
          {activeTab === 'metrics' && metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={Users}
                label="Total Users"
                value={metrics.users.total}
                subValue={`${metrics.users.newLast24h} new today`}
                color="bg-blue-500"
              />
              <MetricCard
                icon={Image}
                label="Total Posts"
                value={metrics.posts.total}
                subValue={`${metrics.posts.newLast24h} new today`}
                color="bg-green-500"
              />
              <MetricCard
                icon={MessageSquare}
                label="Total Comments"
                value={metrics.comments.total}
                color="bg-purple-500"
              />
              <MetricCard
                icon={Heart}
                label="Total Likes"
                value={metrics.likes.total}
                color="bg-red-500"
              />
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Search & Filter */}
              <div className="p-4 border-b flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{user.postCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'status', 'suspended')}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Suspend"
                              >
                                <Ban className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, 'status', 'active')}
                                className="text-green-600 hover:text-green-800"
                                title="Activate"
                              >
                                <Users className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Actions"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="font-medium text-gray-900">{selectedUser.username}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Change Role</p>
              <div className="flex space-x-2">
                <Button
                  variant={selectedUser.role === 'user' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleUserAction(selectedUser.id, 'role', 'user')}
                  loading={actionLoading}
                >
                  User
                </Button>
                <Button
                  variant={selectedUser.role === 'admin' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleUserAction(selectedUser.id, 'role', 'admin')}
                  loading={actionLoading}
                >
                  Admin
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="danger"
                fullWidth
                onClick={() => handleUserAction(selectedUser.id, 'delete')}
                loading={actionLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

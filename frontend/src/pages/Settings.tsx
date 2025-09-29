import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import {
  LoadingSpinner,
  StatCard
} from '../components/common';
import { useToast } from '../components/Toast';
import {
  FiSettings,
  FiUsers,
  FiBook,
  FiDollarSign,
  FiShield,
  FiDatabase,
  FiMail,
  FiGlobe,
  FiSave,
  FiRefreshCw,
  FiDownload,
  FiUpload
} from 'react-icons/fi';

interface SystemSettings {
  systemName: string;
  systemEmail: string;
  maxBooksPerUser: number;
  loanPeriodDays: number;
  finePerDay: number;
  membershipFee: number;
  allowSelfRegistration: boolean;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  backupFrequency: string;
}

interface SystemStats {
  totalUsers: number;
  totalBooks: number;
  totalLoans: number;
  totalRevenue: number;
  systemUptime: string;
  databaseSize: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SystemSettings>({
    systemName: '',
    systemEmail: '',
    maxBooksPerUser: 5,
    loanPeriodDays: 14,
    finePerDay: 10,
    membershipFee: 500,
    allowSelfRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    backupFrequency: 'daily',
  });

  // Fetch system settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setEditForm(data);
      } else {
        // Use default settings if API fails
        setSettings(editForm);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(editForm);
    } finally {
      setLoading(false);
    }
  };

  // Fetch system statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchSettings();
      fetchStats();
    }
  }, [user?.role]);

  // Handle settings update
  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setIsEditing(false);
        showToast('success', 'Settings Updated', 'System settings have been updated successfully');
      } else {
        const errorData = await response.json();
        showToast('error', 'Update Failed', errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('error', 'Error', 'Failed to update settings');
    }
  };

  // Handle system backup
  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `library_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('success', 'Backup Complete', 'System backup has been downloaded successfully');
      } else {
        showToast('error', 'Backup Failed', 'Failed to create system backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('error', 'Error', 'Failed to create backup');
    }
  };

  // Handle system maintenance toggle
  const handleMaintenanceToggle = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => prev ? { ...prev, maintenanceMode: data.maintenanceMode } : null);
        setEditForm(prev => ({ ...prev, maintenanceMode: data.maintenanceMode }));
        showToast('success', 'Maintenance Mode', `Maintenance mode ${data.maintenanceMode ? 'enabled' : 'disabled'}`);
      } else {
        showToast('error', 'Toggle Failed', 'Failed to toggle maintenance mode');
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      showToast('error', 'Error', 'Failed to toggle maintenance mode');
    }
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  // Check if user is admin
  if (user?.role !== 'Admin') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'Member'}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userName={user?.username || 'User'}
            userDisplayName={user?.name}
            userRole={user?.role || 'Member'}
            profilePicture={user?.profilePicture}
            onProfileClick={handleProfileClick}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <FiShield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to access this page.</p>
                <p className="text-gray-500 text-sm mt-2">Administrator access required.</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'Member'}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userName={user?.username || 'User'}
            userDisplayName={user?.name}
            userRole={user?.role || 'Member'}
            profilePicture={user?.profilePicture}
            onProfileClick={handleProfileClick}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
              <LoadingSpinner message="Loading settings..." />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role || 'Member'}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={user?.username || 'User'}
          userDisplayName={user?.name}
          userRole={user?.role || 'Member'}
          profilePicture={user?.profilePicture}
          onProfileClick={handleProfileClick}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and manage administrative functions</p>
            </div>

            {/* System Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers.toString()}
                  icon={FiUsers}
                  color="blue"
                />
                <StatCard
                  title="Total Books"
                  value={stats.totalBooks.toString()}
                  icon={FiBook}
                  color="green"
                />
                <StatCard
                  title="Active Loans"
                  value={stats.totalLoans.toString()}
                  icon={FiRefreshCw}
                  color="yellow"
                />
                <StatCard
                  title="Total Revenue"
                  value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
                  icon={FiDollarSign}
                  color="green"
                />
              </div>
            )}

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* General Settings */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FiSettings className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">General Settings</h3>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Settings
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateSettings}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiSave className="w-4 h-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(settings || editForm);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* System Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.systemName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, systemName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Library Management System"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiGlobe className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{settings?.systemName || 'Library Management System'}</span>
                      </div>
                    )}
                  </div>

                  {/* System Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.systemEmail}
                        onChange={(e) => setEditForm(prev => ({ ...prev, systemEmail: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@library.com"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{settings?.systemEmail || 'admin@library.com'}</span>
                      </div>
                    )}
                  </div>

                  {/* Max Books Per User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Books Per User</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={editForm.maxBooksPerUser}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxBooksPerUser: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiBook className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{settings?.maxBooksPerUser || 5} books</span>
                      </div>
                    )}
                  </div>

                  {/* Loan Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loan Period (Days)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={editForm.loanPeriodDays}
                        onChange={(e) => setEditForm(prev => ({ ...prev, loanPeriodDays: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiRefreshCw className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{settings?.loanPeriodDays || 14} days</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Settings */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                <div className="flex items-center mb-6">
                  <FiDollarSign className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Financial Settings</h3>
                </div>

                <div className="space-y-6">
                  {/* Fine Per Day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fine Per Day (Rs.)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.finePerDay}
                        onChange={(e) => setEditForm(prev => ({ ...prev, finePerDay: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiDollarSign className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">Rs. {(settings?.finePerDay || 10).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Membership Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Membership Fee (Rs.)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.membershipFee}
                        onChange={(e) => setEditForm(prev => ({ ...prev, membershipFee: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiShield className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">Rs. {(settings?.membershipFee || 500).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Configuration */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                <div className="flex items-center mb-6">
                  <FiShield className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">System Configuration</h3>
                </div>

                <div className="space-y-6">
                  {/* Self Registration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow Self Registration</label>
                      <p className="text-xs text-gray-500">Users can register accounts without admin approval</p>
                    </div>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editForm.allowSelfRegistration}
                        onChange={(e) => setEditForm(prev => ({ ...prev, allowSelfRegistration: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        settings?.allowSelfRegistration
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {settings?.allowSelfRegistration ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-xs text-gray-500">Send email notifications for important events</p>
                    </div>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editForm.emailNotifications}
                        onChange={(e) => setEditForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        settings?.emailNotifications
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {settings?.emailNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                      <p className="text-xs text-gray-500">Put system in maintenance mode</p>
                    </div>
                    <button
                      onClick={handleMaintenanceToggle}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        settings?.maintenanceMode
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {settings?.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* System Administration */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                <div className="flex items-center mb-6">
                  <FiDatabase className="w-6 h-6 text-orange-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">System Administration</h3>
                </div>

                <div className="space-y-4">
                  {/* System Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.systemUptime}</div>
                        <div className="text-sm text-gray-600">System Uptime</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.databaseSize}</div>
                        <div className="text-sm text-gray-600">Database Size</div>
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleBackup}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload className="w-5 h-5 mr-2" />
                      Create System Backup
                    </button>

                    <button
                      onClick={() => showToast('info', 'Feature Coming Soon', 'System restore functionality will be available soon')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <FiUpload className="w-5 h-5 mr-2" />
                      Restore from Backup
                    </button>

                    <button
                      onClick={() => showToast('info', 'Feature Coming Soon', 'System logs viewer will be available soon')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FiSettings className="w-5 h-5 mr-2" />
                      View System Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Settings;
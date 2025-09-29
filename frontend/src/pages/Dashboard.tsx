import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { StatCard } from '../components/common';
import {
  FiBook,
  FiUsers,
  FiTrendingUp,
  FiSettings,
  FiUserPlus,
  FiSearch,
  FiClock,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi';

interface DashboardStats {
  // Summary section
  summary?: {
    totalUsers?: number;
    totalBooks?: number;
    totalBookCopies?: number;
    totalCategories?: number;
    totalAuthors?: number;
    totalPublishers?: number;
    totalLanguages?: number;
    totalTransactions?: number;
    activeLoans?: number;
    availableBooks?: number;
  };

  // User breakdown
  userBreakdown?: {
    admins?: number;
    librarians?: number;
    members?: number;
    activeUsers?: number;
    inactiveUsers?: number;
    newUsersThisMonth?: number;
    usersWithFines?: number;
  };

  // Book statistics
  bookStatistics?: {
    booksByStatus?: Record<string, number>;
    booksByLanguage?: Record<string, number>;
    booksByCategory?: Record<string, number>;
    recentlyAddedBooks?: number;
    booksAddedThisMonth?: number;
    mostPopularBooks?: any[];
  };

  // Transaction statistics
  transactionStatistics?: {
    totalTransactions?: number;
    activeTransactions?: number;
    completedTransactions?: number;
    overdueTransactions?: number;
    pendingRequests?: number;
    transactionsThisMonth?: number;
    transactionsThisWeek?: number;
    averageLoanDuration?: number;
  };

  // Financial statistics
  financialStatistics?: {
    totalFines?: number;
    outstandingFines?: number;
    collectedFines?: number;
    finesThisMonth?: number;
    averageFineAmount?: number;
    totalRevenue?: number;
  };

  // Activity metrics
  activityMetrics?: {
    booksIssuedToday?: number;
    booksReturnedToday?: number;
    booksIssuedThisWeek?: number;
    booksReturnedThisWeek?: number;
    booksIssuedThisMonth?: number;
    booksReturnedThisMonth?: number;
    overdueItems?: number;
    itemsDueToday?: number;
  };

  // System health
  systemHealth?: {
    databaseSize?: string;
    lastBackup?: string;
    activeSessions?: number;
    apiRequestsToday?: number;
    errorRate?: number;
  };

  // Trends
  trends?: {
    monthlyLoans?: any[];
    dailyActivity?: any[];
  };

  // Top entities
  topEntities?: {
    topAuthors?: any[];
    topPublishers?: any[];
    topCategories?: any[];
    mostActiveMembers?: any[];
  };

  // Alerts
  alerts?: {
    criticalAlerts?: any[];
    warnings?: any[];
    notifications?: any[];
  };

  // Legacy fields for backward compatibility
  totalBooks?: number;
  totalUsers?: number;
  totalCategories?: number;
  totalAuthors?: number;
  totalPublishers?: number;
  availableBooks?: number;
  totalBookCopies?: number;
  activeTransactions?: number;
  pendingRequests?: number;
  outstandingFines?: number;
  activeLoans?: number;
  overdueItems?: number;
  booksIssuedToday?: number;
  booksReturnedToday?: number;
  booksBorrowed?: number;
  dueSoon?: number;
  booksRead?: number;

  generatedAt?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats based on user role
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      if (user?.role === 'Admin') {
        endpoint = '/api/dashboard/admin/stats';
      } else if (user?.role === 'Librarian') {
        endpoint = '/api/dashboard/librarian/stats';
      } else {
        // For members, we'll use a different approach or static data
        setStats({
          booksBorrowed: 3,
          dueSoon: 1,
          booksRead: 24
        });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }

      const data = await response.json();
      // Flatten the nested structure for backward compatibility
      const flattenedData = {
        ...data,
        // Keep nested structure but also flatten common fields
        totalBooks: data.summary?.totalBooks || data.totalBooks,
        totalUsers: data.summary?.totalUsers || data.totalUsers,
        totalCategories: data.summary?.totalCategories || data.totalCategories,
        totalAuthors: data.summary?.totalAuthors || data.totalAuthors,
        totalPublishers: data.summary?.totalPublishers || data.totalPublishers,
        availableBooks: data.summary?.availableBooks || data.availableBooks,
        totalBookCopies: data.summary?.totalBookCopies || data.totalBookCopies,
        activeTransactions: data.transactionStatistics?.activeTransactions || data.activeTransactions,
        pendingRequests: data.transactionStatistics?.pendingRequests || data.pendingRequests,
        outstandingFines: data.financialStatistics?.outstandingFines || data.outstandingFines,
        activeLoans: data.summary?.activeLoans || data.activeLoans,
        overdueItems: data.transactionStatistics?.overdueTransactions || data.overdueItems,
        booksIssuedToday: data.activityMetrics?.booksIssuedToday || data.booksIssuedToday,
        booksReturnedToday: data.activityMetrics?.booksReturnedToday || data.booksReturnedToday,
      };
      setStats(flattenedData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const handleProfileClick = () => {
    // Handle profile click - could navigate to profile page
    console.log('Profile clicked');
  };

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Books"
          value={stats.summary?.totalBooks?.toString() || "0"}
          icon={FiBook}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={stats.summary?.totalUsers?.toString() || "0"}
          icon={FiUsers}
          color="green"
        />
        <StatCard
          title="Available Books"
          value={stats.summary?.availableBooks?.toString() || "0"}
          icon={FiBook}
          color="indigo"
        />
        <StatCard
          title="Book Copies"
          value={stats.summary?.totalBookCopies?.toString() || "0"}
          icon={FiBook}
          color="purple"
        />
        <StatCard
          title="Total Authors"
          value={stats.summary?.totalAuthors?.toString() || "0"}
          icon={FiUserPlus}
          color="indigo"
        />
        <StatCard
          title="Total Categories"
          value={stats.summary?.totalCategories?.toString() || "0"}
          icon={FiSettings}
          color="purple"
        />
        <StatCard
          title="Total Publishers"
          value={stats.summary?.totalPublishers?.toString() || "0"}
          icon={FiTrendingUp}
          color="blue"
        />
        <StatCard
          title="Active Loans"
          value={stats.summary?.activeLoans?.toString() || "0"}
          icon={FiActivity}
          color="green"
        />
      </div>

      {/* User Breakdown & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <FiUsers className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">User Distribution</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <span className="text-gray-700 font-medium">Administrators</span>
              <span className="text-2xl font-bold text-blue-600">{stats.userBreakdown?.admins || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <span className="text-gray-700 font-medium">Librarians</span>
              <span className="text-2xl font-bold text-green-600">{stats.userBreakdown?.librarians || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <span className="text-gray-700 font-medium">Members</span>
              <span className="text-2xl font-bold text-purple-600">{stats.userBreakdown?.members || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl border-t-2 border-gray-200">
              <span className="text-gray-900 font-bold">Total Users</span>
              <span className="text-2xl font-bold text-gray-900">{stats.summary?.totalUsers || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <FiTrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Financial Overview</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
              <span className="text-gray-700 font-medium">Outstanding Fines</span>
              <span className="text-2xl font-bold text-red-600">${stats.financialStatistics?.outstandingFines?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <span className="text-gray-700 font-medium">Collected Fines</span>
              <span className="text-2xl font-bold text-green-600">${stats.financialStatistics?.collectedFines?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <span className="text-gray-700 font-medium">Total Fines</span>
              <span className="text-2xl font-bold text-blue-600">{stats.financialStatistics?.totalFines || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <span className="text-gray-700 font-medium">Fines This Month</span>
              <span className="text-2xl font-bold text-purple-600">${stats.financialStatistics?.finesThisMonth?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <FiActivity className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Transaction Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-700 font-medium">Active Transactions</span>
              <span className="text-2xl font-bold text-blue-600">{stats.transactionStatistics?.activeTransactions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium">Completed Transactions</span>
              <span className="text-2xl font-bold text-green-600">{stats.transactionStatistics?.completedTransactions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
              <span className="text-gray-700 font-medium">Overdue Transactions</span>
              <span className="text-2xl font-bold text-red-600">{stats.transactionStatistics?.overdueTransactions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl">
              <span className="text-gray-700 font-medium">Pending Requests</span>
              <span className="text-2xl font-bold text-yellow-600">{stats.transactionStatistics?.pendingRequests || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <FiClock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Today's Activity</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium">Books Issued Today</span>
              <span className="text-2xl font-bold text-green-600">{stats.activityMetrics?.booksIssuedToday || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-700 font-medium">Books Returned Today</span>
              <span className="text-2xl font-bold text-blue-600">{stats.activityMetrics?.booksReturnedToday || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl">
              <span className="text-gray-700 font-medium">Items Due Today</span>
              <span className="text-2xl font-bold text-yellow-600">{stats.activityMetrics?.itemsDueToday || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
              <span className="text-gray-700 font-medium">Overdue Items</span>
              <span className="text-2xl font-bold text-red-600">{stats.activityMetrics?.overdueItems || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 rounded-xl mr-4">
              <FiSettings className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">System Health</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700 font-medium">Database Size</span>
              <span className="text-lg font-bold text-gray-900">{stats.systemHealth?.databaseSize || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="text-gray-700 font-medium">Active Sessions</span>
              <span className="text-2xl font-bold text-blue-600">{stats.systemHealth?.activeSessions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium">API Requests Today</span>
              <span className="text-2xl font-bold text-green-600">{stats.systemHealth?.apiRequestsToday || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
              <span className="text-gray-700 font-medium">Error Rate</span>
              <span className="text-2xl font-bold text-red-600">{stats.systemHealth?.errorRate ? `${(stats.systemHealth.errorRate * 100).toFixed(2)}%` : "0.00%"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Book Statistics */}
      {stats.bookStatistics?.booksByStatus && (
        <div className="bg-gradient-to-br from-white to-indigo-50 p-8 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl mr-4">
              <FiBook className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Book Status Distribution</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(stats.bookStatistics.booksByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{count}</div>
                <div className="text-sm font-medium text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {(stats.alerts?.criticalAlerts?.length || stats.alerts?.warnings?.length) && (
        <div className="bg-gradient-to-br from-white to-red-50 p-8 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-100 rounded-xl mr-4">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">System Alerts</h3>
          </div>
          <div className="space-y-4">
            {stats.alerts?.criticalAlerts?.map((alert: any, index: number) => (
              <div key={`critical-${index}`} className="flex items-center space-x-4 p-6 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-300">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-red-800">{alert.message}</p>
                  <p className="text-sm text-red-600 mt-1">Count: {alert.count}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Critical
                  </span>
                </div>
              </div>
            ))}
            {stats.alerts?.warnings?.map((warning: any, index: number) => (
              <div key={`warning-${index}`} className="flex items-center space-x-4 p-6 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-all duration-300">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-yellow-800">{warning.message}</p>
                  <p className="text-sm text-yellow-600 mt-1">Count: {warning.count}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Warning
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-xl mr-4">
            <FiActivity className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="group flex items-center space-x-4 p-6 bg-white hover:bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
            <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
              <FiUserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-left">
              <span className="text-lg font-semibold text-blue-700 block">Add New User</span>
              <span className="text-sm text-blue-600">Create a new library member</span>
            </div>
          </button>
          <button className="group flex items-center space-x-4 p-6 bg-white hover:bg-green-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
            <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
              <FiBook className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-left">
              <span className="text-lg font-semibold text-green-700 block">Add New Book</span>
              <span className="text-sm text-green-600">Add a book to the catalog</span>
            </div>
          </button>
          <button className="group flex items-center space-x-4 p-6 bg-white hover:bg-purple-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200">
            <div className="p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
              <FiSettings className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-left">
              <span className="text-lg font-semibold text-purple-700 block">System Settings</span>
              <span className="text-sm text-purple-600">Configure library settings</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderLibrarianDashboard = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Librarian Dashboard</h2>
            <p className="text-gray-600 text-lg">Welcome back, {user?.username}! Manage daily library operations.</p>
          </div>
          <div className="p-4 bg-blue-100 rounded-xl">
            <FiActivity className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Books Checked Out</p>
              <p className="text-4xl font-bold text-blue-900">{stats.activeLoans || 0}</p>
            </div>
            <div className="p-4 bg-blue-200 rounded-xl">
              <FiBook className="h-10 w-10 text-blue-700" />
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full" style={{width: '75%'}}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Due Today</p>
              <p className="text-4xl font-bold text-green-900">{stats.booksIssuedToday || 0}</p>
            </div>
            <div className="p-4 bg-green-200 rounded-xl">
              <FiClock className="h-10 w-10 text-green-700" />
            </div>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3">
            <div className="bg-green-600 h-3 rounded-full" style={{width: '60%'}}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-red-600 uppercase tracking-wide">Overdue</p>
              <p className="text-4xl font-bold text-red-900">{stats.overdueItems || 0}</p>
            </div>
            <div className="p-4 bg-red-200 rounded-xl">
              <FiAlertCircle className="h-10 w-10 text-red-700" />
            </div>
          </div>
          <div className="w-full bg-red-200 rounded-full h-3">
            <div className="bg-red-600 h-3 rounded-full" style={{width: '30%'}}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <FiClock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Today's Tasks</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <FiBook className="h-5 w-5 text-blue-700" />
                </div>
                <span className="text-gray-900 font-medium">Process book returns</span>
              </div>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">8 items</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-200 rounded-lg">
                  <FiUserPlus className="h-5 w-5 text-green-700" />
                </div>
                <span className="text-gray-900 font-medium">Check in new books</span>
              </div>
              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">3 items</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <FiUsers className="h-5 w-5 text-purple-700" />
                </div>
                <span className="text-gray-900 font-medium">Update member records</span>
              </div>
              <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">5 items</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <FiSearch className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Quick Search</h3>
          </div>
          <div className="space-y-4">
            <button className="w-full group flex items-center space-x-4 p-6 bg-white hover:bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                <FiBook className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="text-lg font-semibold text-blue-700 block">Search Books</span>
                <span className="text-sm text-blue-600">Find books in the catalog</span>
              </div>
            </button>
            <button className="w-full group flex items-center space-x-4 p-6 bg-white hover:bg-green-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
                <FiUsers className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-left">
                <span className="text-lg font-semibold text-green-700 block">Search Members</span>
                <span className="text-sm text-green-600">Find library members</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMemberDashboard = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-2xl shadow-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Member Dashboard</h2>
            <p className="text-gray-600 text-lg">Welcome back, {user?.username}! Explore our library collection.</p>
          </div>
          <div className="p-4 bg-purple-100 rounded-xl">
            <FiBook className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Books Borrowed</p>
              <p className="text-4xl font-bold text-blue-900">{stats.booksBorrowed || 0}</p>
            </div>
            <div className="p-4 bg-blue-200 rounded-xl">
              <FiBook className="h-10 w-10 text-blue-700" />
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full" style={{width: '40%'}}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Due Soon</p>
              <p className="text-4xl font-bold text-green-900">{stats.dueSoon || 0}</p>
            </div>
            <div className="p-4 bg-green-200 rounded-xl">
              <FiClock className="h-10 w-10 text-green-700" />
            </div>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3">
            <div className="bg-green-600 h-3 rounded-full" style={{width: '20%'}}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Books Read</p>
              <p className="text-4xl font-bold text-purple-900">{stats.booksRead || 0}</p>
            </div>
            <div className="p-4 bg-purple-200 rounded-xl">
              <FiTrendingUp className="h-10 w-10 text-purple-700" />
            </div>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-3">
            <div className="bg-purple-600 h-3 rounded-full" style={{width: '85%'}}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <FiBook className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">My Books</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
              <div className="flex-1">
                <p className="text-gray-900 font-bold text-lg">The Great Gatsby</p>
                <p className="text-gray-600">Due: Oct 15, 2025</p>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                On Time
              </span>
            </div>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-300">
              <div className="flex-1">
                <p className="text-gray-900 font-bold text-lg">Pride and Prejudice</p>
                <p className="text-gray-600">Due: Oct 10, 2025</p>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Due Soon
              </span>
            </div>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex-1">
                <p className="text-gray-900 font-bold text-lg">1984</p>
                <p className="text-gray-600">Returned</p>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Returned
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <FiActivity className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-4">
            <button className="w-full group flex items-center space-x-4 p-6 bg-white hover:bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                <FiSearch className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="text-lg font-semibold text-blue-700 block">Browse Books</span>
                <span className="text-sm text-blue-600">Explore our collection</span>
              </div>
            </button>
            <button className="w-full group flex items-center space-x-4 p-6 bg-white hover:bg-green-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
                <FiClock className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-left">
                <span className="text-lg font-semibold text-green-700 block">View History</span>
                <span className="text-sm text-green-600">Check your borrowing history</span>
              </div>
            </button>
            <button className="w-full group flex items-center space-x-4 p-6 bg-white hover:bg-purple-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
                <FiTrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-left">
                <span className="text-lg font-semibold text-purple-700 block">Reading Stats</span>
                <span className="text-sm text-purple-600">View your reading progress</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
            {loading ? (
              <div className="flex flex-col justify-center items-center h-96 space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
                  <p className="text-gray-600">Fetching your library statistics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <FiAlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
                    <p className="text-red-700 mb-6">{error}</p>
                    <button
                      onClick={fetchDashboardStats}
                      className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <FiActivity className="h-5 w-5 mr-2" />
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {user?.role === 'Admin' && renderAdminDashboard()}
                {user?.role === 'Librarian' && renderLibrarianDashboard()}
                {user?.role === 'Member' && renderMemberDashboard()}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
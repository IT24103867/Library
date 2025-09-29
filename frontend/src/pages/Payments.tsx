import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import {
  SearchBar,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  Pagination,
  Dropdown,
  Modal,
  StatCard
} from '../components/common';
import { useToast } from '../components/Toast';
import { FiCreditCard, FiDollarSign, FiCheckCircle, FiClock, FiDownload, FiEye } from 'react-icons/fi';

interface Payment {
  id: number;
  userId: number;
  fineId?: number;
  amount: number;
  type: 'LOST_BOOK_CHARGE' | 'DAMAGED_BOOK_CHARGE' | 'LATE_RETURN_CHARGE' | 'MEMBERSHIP_FEE' | 'OTHER';
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  method: 'CASH' | 'CARD' | 'PAYHERE' | 'BANK_TRANSFER' | 'OTHER';
  orderID?: string;
  paymentID?: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  description?: string;
  transactionReference?: string;
  user: {
    id: number;
    username: string;
    name: string;
    email?: string;
  };
  fine?: {
    id: number;
    type: string;
    description?: string;
  };
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
}

const Payments: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Search cache and debouncing
  const searchTimeoutRef = useRef<number | null>(null);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Debounce search term changes
  useEffect(() => {
    setIsSearchDebouncing(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearchDebouncing(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch payments data
  const fetchPayments = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const url = `http://localhost:8080/api/payments`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error fetching payments:', error);
        showToast('error', 'Error', 'Failed to load payments data');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch payment statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/payments/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  }, []);

  // Initialize data and handle search/filter changes
  useEffect(() => {
    const controller = new AbortController();
    fetchPayments(controller.signal);

    return () => controller.abort();
  }, [fetchPayments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Client-side filtering and pagination
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(payment =>
        payment.user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.user.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.orderID?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.paymentID?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        payment.id.toString().includes(debouncedSearchTerm)
      );
    }

    // Method filter
    if (selectedMethod) {
      filtered = filtered.filter(payment => payment.method === selectedMethod);
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(payment => payment.type === selectedType);
    }

    return filtered;
  }, [payments, debouncedSearchTerm, selectedMethod, selectedType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / 10);
  const startIndex = currentPage * 10;
  const endIndex = startIndex + 10;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusMap = {
      COMPLETED: 'active',
      PENDING: 'pending',
      PROCESSING: 'pending',
      FAILED: 'suspended',
      CANCELLED: 'inactive',
      REFUNDED: 'active',
    };

    const mappedStatus = statusMap[status as keyof typeof statusMap] || 'inactive';
    return <StatusBadge status={mappedStatus} text={status} />;
  };

  // Method badge component
  const getMethodBadge = (method: string) => {
    const methodMap = {
      CASH: 'active',
      CARD: 'active',
      PAYHERE: 'pending',
      BANK_TRANSFER: 'pending',
      OTHER: 'inactive',
    };

    const mappedStatus = methodMap[method as keyof typeof methodMap] || 'inactive';
    return <StatusBadge status={mappedStatus} text={method} />;
  };

  // Type badge component
  const getTypeBadge = (type: string) => {
    const typeMap = {
      LOST_BOOK_CHARGE: 'suspended',
      DAMAGED_BOOK_CHARGE: 'suspended',
      LATE_RETURN_CHARGE: 'pending',
      MEMBERSHIP_FEE: 'active',
      OTHER: 'inactive',
    };

    const mappedStatus = typeMap[type as keyof typeof typeMap] || 'inactive';
    return <StatusBadge status={mappedStatus} text={type} />;
  };

  // Export payments to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'User', 'Amount', 'Type', 'Method', 'Status', 'Order ID', 'Payment ID', 'Created At', 'Paid At'];
    const csvData = filteredPayments.map(payment => [
      payment.id,
      payment.user.name || payment.user.username,
      payment.amount,
      payment.type,
      payment.method,
      payment.status,
      payment.orderID || '',
      payment.paymentID || '',
      new Date(payment.createdAt).toLocaleDateString(),
      payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Export Complete', 'Payments data exported successfully');
  };

  // View payment details
  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

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
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Payments"
                  value={stats.totalPayments.toString()}
                  icon={FiCreditCard}
                  color="blue"
                />
                <StatCard
                  title="Total Amount"
                  value={`Rs. ${stats.totalAmount.toLocaleString()}`}
                  icon={FiDollarSign}
                  color="green"
                />
                <StatCard
                  title="Completed"
                  value={stats.completedPayments.toString()}
                  icon={FiCheckCircle}
                  color="green"
                />
                <StatCard
                  title="Pending"
                  value={stats.pendingPayments.toString()}
                  icon={FiClock}
                  color="yellow"
                />
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <SearchBar
                      placeholder="Search payments by user, amount, or transaction ID..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                      className="w-full"
                    />
                    {isSearchDebouncing && searchTerm.trim().length >= 2 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600 mr-1"></div>
                          Searching...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Status Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'PROCESSING', label: 'Processing' },
                      { value: 'FAILED', label: 'Failed' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                      { value: 'REFUNDED', label: 'Refunded' },
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="Status"
                    className="w-40"
                  />

                  {/* Method Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Methods' },
                      { value: 'CASH', label: 'Cash' },
                      { value: 'CARD', label: 'Card' },
                      { value: 'PAYHERE', label: 'PayHere' },
                      { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    placeholder="Method"
                    className="w-40"
                  />

                  {/* Type Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Types' },
                      { value: 'LOST_BOOK_CHARGE', label: 'Lost Book Charge' },
                      { value: 'DAMAGED_BOOK_CHARGE', label: 'Damaged Book Charge' },
                      { value: 'LATE_RETURN_CHARGE', label: 'Late Return Charge' },
                      { value: 'MEMBERSHIP_FEE', label: 'Membership Fee' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                    value={selectedType}
                    onChange={setSelectedType}
                    placeholder="Type"
                    className="w-40"
                  />

                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatus('');
                      setSelectedMethod('');
                      setSelectedType('');
                    }}
                    className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Clear Filters
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
              {loading ? (
                <LoadingSpinner message="Loading payments..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Payment Details
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Type & Method
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/60">
                      {currentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-12 text-center">
                            <EmptyState
                              icon={FiCreditCard}
                              title="No payments found"
                              description={debouncedSearchTerm || selectedMethod || selectedType ?
                                "Try adjusting your search criteria or filters" :
                                "No payments available in the system"}
                            />
                          </td>
                        </tr>
                      ) : (
                        currentPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                  #{payment.id}
                                </div>
                                {payment.orderID && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Order: {payment.orderID}
                                  </div>
                                )}
                                {payment.paymentID && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    PayID: {payment.paymentID}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold text-gray-900">
                                  {payment.user.name || payment.user.username}
                                </div>
                                {payment.user.email && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {payment.user.email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-sm font-semibold text-gray-900">
                                Rs. {payment.amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-2">
                                {getTypeBadge(payment.type)}
                                {getMethodBadge(payment.method)}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <div className="text-sm text-gray-900">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </div>
                                {payment.paidAt && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Paid: {new Date(payment.paidAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-medium">
                              <button
                                onClick={() => viewPaymentDetails(payment)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                              >
                                <FiEye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/60">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="justify-center sm:justify-end"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Payment Details"
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment ID</label>
                <p className="text-sm text-gray-900">#{selectedPayment.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                <p className="text-sm text-gray-900">{selectedPayment.orderID || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment ID</label>
                <p className="text-sm text-gray-900">{selectedPayment.paymentID || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <p className="text-sm text-gray-900">Rs. {selectedPayment.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="mt-1">{getTypeBadge(selectedPayment.type)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                <div className="mt-1">{getMethodBadge(selectedPayment.method)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Ref</label>
                <p className="text-sm text-gray-900">{selectedPayment.transactionReference || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <p className="text-sm text-gray-900">
                {selectedPayment.user.name || selectedPayment.user.username}
                {selectedPayment.user.email && ` (${selectedPayment.user.email})`}
              </p>
            </div>

            {selectedPayment.fine && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Related Fine</label>
                <p className="text-sm text-gray-900">
                  Fine #{selectedPayment.fine.id} - {selectedPayment.fine.type}
                  {selectedPayment.fine.description && ` (${selectedPayment.fine.description})`}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-sm text-gray-900">{selectedPayment.description || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedPayment.paidAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPayment.paidAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedPayment.cancelledAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancelled At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedPayment.cancelledAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Payments;
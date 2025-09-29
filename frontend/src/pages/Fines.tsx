import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { useToast } from '../components/Toast';
import { SearchBar, LoadingSpinner, EmptyState, Modal, Dropdown } from '../components/common';
import {
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCreditCard,
  FiX
} from 'react-icons/fi';

// PayHere types
declare global {
  interface Window {
    payhere: any;
  }
}

interface Fine {
  id: number;
  userId: number;
  transactionId?: number;
  type: 'OVERDUE' | 'DAMAGED' | 'LOST' | 'LATE_RETURN' | 'OTHER';
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PAID' | 'WAIVED' | 'PARTIALLY_PAID';
  createdAt: string;
  dueDate?: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  book: {
    id: number;
    title: string;
    authorName: string;
    isbn: string;
  };
}

const Fines: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  // Form states
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentReference: ''
  });

  const [waiveForm, setWaiveForm] = useState({
    reason: ''
  });

  useEffect(() => {
    loadFines();
  }, [user]);

  // Debounce search term changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const loadFines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let url = 'http://localhost:8080/api/fines';

      // For members, use their own fines endpoint
      if (user?.role === 'Member') {
        url = 'http://localhost:8080/api/fines/my-fines';
      } else {
        // Staff can see all fines with pagination
        url = 'http://localhost:8080/api/fines?page=0&pageSize=100';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const finesData = await response.json();
        setFines(finesData);
      } else {
        console.error('Failed to load fines');
        setFines([]);
      }
    } catch (error) {
      console.error('Error loading fines:', error);
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async () => {
    if (!selectedFine || !payForm.amount) {
      showToast('warning', 'Validation Error', 'Please enter payment amount');
      return;
    }

    const amount = parseFloat(payForm.amount);
    if (amount <= 0 || amount > selectedFine.remainingAmount) {
      showToast('warning', 'Validation Error', 'Invalid payment amount');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/fines/${selectedFine.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          paymentReference: payForm.paymentReference
        })
      });

      if (response.ok) {
        showToast('success', 'Payment Recorded', 'Fine payment has been recorded successfully');
        setShowPayModal(false);
        setSelectedFine(null);
        setPayForm({ amount: '', paymentReference: '' });
        loadFines();
      } else {
        const errorData = await response.json();
        showToast('error', 'Payment Failed', errorData.error || errorData.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error paying fine:', error);
      showToast('error', 'Payment Failed', 'Failed to record payment. Please try again.');
    }
  };

  const handleWaiveFine = async () => {
    if (!waiveForm.reason.trim()) {
      showToast('error', 'Validation Error', 'Please enter a reason for waiving the fine');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/fines/${selectedFine?.id}/waive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: waiveForm.reason
        })
      });

      if (response.ok) {
        showToast('success', 'Fine Waived', 'Fine has been successfully waived');
        loadFines();
        setShowWaiveModal(false);
        setSelectedFine(null);
        setWaiveForm({ reason: '' });
      } else {
        const errorData = await response.json();
        showToast('error', 'Waive Failed', errorData.message || 'Failed to waive fine. Please try again.');
      }
    } catch (error) {
      console.error('Error waiving fine:', error);
      showToast('error', 'Waive Failed', 'Failed to waive fine. Please try again.');
    }
  };

  const initiatePayHerePayment = async (fine: Fine) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Create payment record on backend
      const response = await fetch('http://localhost:8080/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fineId: fine.id,
          method: 'PAYHERE'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const result = await response.json();
      const paymentData = result.payHereData;

      // PayHere configuration
      const payment = {
        sandbox: true, // Set to false for production
        merchant_id: paymentData.merchant_id,
        return_url: paymentData.return_url,
        cancel_url: paymentData.cancel_url,
        notify_url: paymentData.notify_url,
        order_id: paymentData.order_id,
        items: paymentData.items,
        amount: paymentData.amount,
        currency: paymentData.currency,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        email: paymentData.email,
        phone: paymentData.phone,
        address: paymentData.address,
        city: paymentData.city,
        country: paymentData.country,
        hash: paymentData.hash // Hash generated by backend for security
      };

      // Start PayHere payment
      if (window.payhere) {
        window.payhere.startPayment(payment);
      } else {
        showToast('error', 'Payment Error', 'PayHere is not loaded. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error initiating PayHere payment:', error);
      showToast('error', 'Payment Error', 'Failed to initiate payment. Please try again.');
    }
  };

  // PayHere callback handlers
  useEffect(() => {
    const handlePaymentSuccess = () => {
      showToast('success', 'Payment Successful', 'Your fine payment has been processed successfully!');
      loadFines();
    };

    const handlePaymentCancelled = () => {
      showToast('warning', 'Payment Cancelled', 'Payment was cancelled.');
    };

    // Check URL parameters for payment status
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      handlePaymentSuccess();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      handlePaymentCancelled();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Set up PayHere callbacks
    if (window.payhere) {
      window.payhere.onCompleted = function onCompleted(orderId: string) {
        console.log("Payment completed. OrderID:" + orderId);
        handlePaymentSuccess();
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed");
        handlePaymentCancelled();
      };

      window.payhere.onError = function onError(error: any) {
        console.log("Error:" + error);
        showToast('error', 'Payment Error', 'An error occurred during payment.');
      };
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
      PAID: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      WAIVED: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle },
      PARTIALLY_PAID: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      OVERDUE: { color: 'bg-orange-100 text-orange-800', icon: FiClock },
      DAMAGED_BOOK: { color: 'bg-red-100 text-red-800', icon: FiAlertTriangle },
      LOST_BOOK: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle },
      CUSTOM: { color: 'bg-purple-100 text-purple-800', icon: FiDollarSign }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.CUSTOM;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredFines = () => {
    let filtered = fines;

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(fine =>
        (fine.user?.name?.toLowerCase().includes(searchLower)) ||
        (fine.user?.email?.toLowerCase().includes(searchLower)) ||
        (fine.user?.username?.toLowerCase().includes(searchLower)) ||
        (fine.book?.title?.toLowerCase().includes(searchLower)) ||
        (fine.book?.authorName?.toLowerCase().includes(searchLower)) ||
        (fine.book?.isbn?.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(fine => fine.status === selectedStatus);
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(fine => fine.type === selectedType);
    }

    return filtered;
  };

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    // No cache to clear for fines
  }, []);

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
          onProfileClick={() => {}}
        />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <SearchBar
                      placeholder="Search fines by user name, email, book title, or author..."
                      value={searchTerm}
                      onChange={setSearchTerm}
                      className="w-full"
                    />
                    {debouncedSearchTerm.trim().length >= 2 && (
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
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'PAID', label: 'Paid' },
                      { value: 'WAIVED', label: 'Waived' },
                      { value: 'PARTIALLY_PAID', label: 'Partially Paid' }
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="Status"
                    className="w-32"
                  />

                  {/* Type Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Types' },
                      { value: 'OVERDUE', label: 'Overdue' },
                      { value: 'DAMAGED', label: 'Damaged Book' },
                      { value: 'LOST', label: 'Lost Book' },
                      { value: 'LATE_RETURN', label: 'Late Return' },
                      { value: 'OTHER', label: 'Other' }
                    ]}
                    value={selectedType}
                    onChange={setSelectedType}
                    placeholder="Type"
                    className="w-32"
                  />

                  <button
                    onClick={() => {
                      setSelectedStatus('');
                      setSelectedType('');
                      setSearchTerm('');
                      clearSearchCache();
                    }}
                    className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Fines Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner message="Loading fines..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/60">
                      <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <tr>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            User & Book Details
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Fine Details
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status & Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200/60">
                        {filteredFines().length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-8 py-12 text-center">
                              <EmptyState
                                icon={FiDollarSign}
                                title="No fines found"
                                description={searchTerm || selectedStatus || selectedType ?
                                  "Try adjusting your search criteria or filters" :
                                  "No fines available"}
                              />
                            </td>
                          </tr>
                        ) : (
                          filteredFines().map((fine) => (
                            <tr key={fine.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                              <td className="px-8 py-6">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {fine.user?.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {fine.user?.email}
                                    </div>
                                    {fine.book && (
                                      <>
                                        <div className="text-xs text-gray-500 mt-2">
                                          Book: {fine.book.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          by {fine.book.authorName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ISBN: {fine.book.isbn}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center mb-2">
                                  {getTypeBadge(fine.type)}
                                </div>
                                <div className="text-sm text-gray-900 font-medium">
                                  Total: ${fine.amount.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Paid: ${fine.paidAmount.toFixed(2)}
                                </div>
                                {fine.remainingAmount > 0 && (
                                  <div className="text-sm text-red-600 font-medium">
                                    Remaining: ${fine.remainingAmount.toFixed(2)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  Created: {formatDate(fine.createdAt)}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center mb-2">
                                  {getStatusBadge(fine.status)}
                                </div>
                                <div className="flex items-center space-x-3">
                                  {fine.status === 'PENDING' || fine.status === 'PARTIALLY_PAID' ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedFine(fine);
                                          setPayForm({
                                            amount: fine.remainingAmount.toString(),
                                            paymentReference: ''
                                          });
                                          setShowPayModal(true);
                                        }}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                        title="Pay Fine (Manual)"
                                      >
                                        <FiCreditCard className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => initiatePayHerePayment(fine)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                        title="Pay with PayHere"
                                      >
                                        <FiDollarSign className="w-4 h-4" />
                                      </button>
                                      {user?.role === 'Admin' && (
                                        <button
                                          onClick={() => {
                                            setSelectedFine(fine);
                                            setShowWaiveModal(true);
                                          }}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                          title="Waive Fine"
                                        >
                                          <FiX className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Pay Fine Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedFine(null);
          setPayForm({ amount: '', paymentReference: '' });
        }}
        title="Pay Fine"
        size="md"
      >
        <div className="space-y-4">
          {selectedFine && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Fine Details</h3>
              <div className="text-sm text-gray-600">
                <div>User: {selectedFine.user?.name}</div>
                <div>Type: {selectedFine.type.replace('_', ' ')}</div>
                <div>Total Amount: ${selectedFine.amount.toFixed(2)}</div>
                <div>Remaining: ${selectedFine.remainingAmount.toFixed(2)}</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedFine?.remainingAmount}
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter payment amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (Optional)</label>
            <input
              type="text"
              value={payForm.paymentReference}
              onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Receipt number, transaction ID, etc."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowPayModal(false);
              setSelectedFine(null);
              setPayForm({ amount: '', paymentReference: '' });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handlePayFine}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Record Payment
          </button>
        </div>
      </Modal>

      {/* Waive Fine Modal */}
      <Modal
        isOpen={showWaiveModal}
        onClose={() => {
          setShowWaiveModal(false);
          setSelectedFine(null);
          setWaiveForm({ reason: '' });
        }}
        title="Waive Fine"
        size="md"
      >
        <div className="space-y-4">
          {selectedFine && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Fine Details</h3>
              <div className="text-sm text-gray-600">
                <div>User: {selectedFine.user?.name}</div>
                <div>Type: {selectedFine.type.replace('_', ' ')}</div>
                <div>Amount: ${selectedFine.amount.toFixed(2)}</div>
                <div>Status: {selectedFine.status}</div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Waiving this fine will permanently remove the outstanding amount. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Waiver <span className="text-red-500">*</span></label>
            <textarea
              value={waiveForm.reason}
              onChange={(e) => setWaiveForm({ reason: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide a detailed reason for waiving this fine..."
              rows={3}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowWaiveModal(false);
              setSelectedFine(null);
              setWaiveForm({ reason: '' });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleWaiveFine}
            disabled={!waiveForm.reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Waive Fine
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Fines;
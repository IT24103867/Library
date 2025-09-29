import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { useToast } from '../components/Toast';
import { SearchBar, LoadingSpinner, EmptyState, Modal, Dropdown, FloatingActionButton, DeleteConfirmModal } from '../components/common';
import {
  FiBook,
  FiCalendar,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMinus
} from 'react-icons/fi';

interface BookTransaction {
  id: number;
  bookCopyId: number;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  bookCopyBarcode: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST' | 'CANCELLED' | 'RENEWED';
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  overdueDays: number;
  fineAmount: number;
  finePaid: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface BookCopy {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthorName: string;
  bookIsbn: string;
  barcode: string;
  condition: string;
  status: string;
}

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states - combine all transactions
  const [allTransactions, setAllTransactions] = useState<BookTransaction[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showLostConfirmModal, setShowLostConfirmModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isMarkingLost, setIsMarkingLost] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Search cache and debouncing
  const searchCache = useRef(new Map<string, any>());
  const searchTimeoutRef = useRef<number | null>(null);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Form states
  const [returnForm, setReturnForm] = useState({
    bookCopyId: '',
    returnCondition: 'GOOD' as const,
    notes: ''
  });

  const [issueForm, setIssueForm] = useState({
    userId: '',
    bookCopyId: '',
    notes: ''
  });

  // Search and filter states
  // Modal search states

  useEffect(() => {
    loadInitialData();
  }, [user]);

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

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await loadAllTransactions();
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTransactions = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const transactions = await response.json();
        setAllTransactions(transactions);
      } else {
        console.error('Failed to load transactions');
        setAllTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setAllTransactions([]);
    }
  };

  const handleReturnBook = async () => {
    if (!returnForm.bookCopyId) {
      showToast('warning', 'Validation Error', 'Please select a book copy');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/transactions/return', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookCopyId: parseInt(returnForm.bookCopyId),
          returnCondition: returnForm.returnCondition,
          notes: returnForm.notes
        })
      });

      if (response.ok) {
        showToast('success', 'Book Returned', 'Book has been returned successfully');
        setShowReturnModal(false);
        setReturnForm({ bookCopyId: '', returnCondition: 'GOOD', notes: '' });
        loadAllTransactions();
      } else {
        const errorData = await response.json();
        showToast('error', 'Return Failed', errorData.error || errorData.message || 'Failed to return book');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      showToast('error', 'Return Failed', 'Failed to return book. Please try again.');
    }
  };

  const handleMarkAsLost = async (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setShowLostConfirmModal(true);
  };

  const confirmMarkAsLost = async () => {
    if (!selectedTransactionId) return;

    setIsMarkingLost(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/transactions/${selectedTransactionId}/mark-lost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast('success', 'Book Marked as Lost', 'Book has been marked as lost');
        loadAllTransactions();
        setShowLostConfirmModal(false);
        setSelectedTransactionId(null);
      } else {
        const errorData = await response.json();
        showToast('error', 'Action Failed', errorData.error || errorData.message || 'Failed to mark book as lost');
      }
    } catch (error) {
      console.error('Error marking book as lost:', error);
      showToast('error', 'Action Failed', 'Failed to mark book as lost. Please try again.');
    } finally {
      setIsMarkingLost(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-blue-100 text-blue-800', icon: FiClock },
      RETURNED: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      RENEWED: { color: 'bg-purple-100 text-purple-800', icon: FiRefreshCw },
      OVERDUE: { color: 'bg-red-100 text-red-800', icon: FiAlertTriangle },
      LOST: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle },
      CANCELLED: { color: 'bg-yellow-100 text-yellow-800', icon: FiXCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
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

  const filteredTransactions = () => {
    let filtered = allTransactions;

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.bookTitle.toLowerCase().includes(searchLower) ||
        transaction.bookAuthor.toLowerCase().includes(searchLower) ||
        transaction.userName.toLowerCase().includes(searchLower) ||
        transaction.bookIsbn.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(transaction => transaction.status === selectedStatus);
    }

    return filtered;
  };

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    searchCache.current.clear();
  }, []);

  const searchUsers = async (query: string): Promise<{ value: string; label: string }[]> => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/search?query=${encodeURIComponent(query)}&size=3`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        return Array.isArray(users) ? users.map((user: User) => ({
          value: user.id.toString(),
          label: `${user.name} (${user.email})`
        })) : [];
      } else {
        console.error('Failed to search users');
        return [];
      }
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const searchAvailableCopies = async (query: string): Promise<{ value: string; label: string }[]> => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/book-copies/search-available?query=${encodeURIComponent(query)}&size=3`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const copies = await response.json();
        return Array.isArray(copies) ? copies.map((copy: BookCopy) => ({
          value: copy.id.toString(),
          label: `${copy.bookTitle} by ${copy.bookAuthorName} (ISBN: ${copy.bookIsbn}) - ${copy.barcode}`
        })) : [];
      } else {
        console.error('Failed to search available copies');
        return [];
      }
    } catch (error) {
      console.error('Error searching available copies:', error);
      return [];
    }
  };

  const handleIssueBook = async () => {
    if (!issueForm.userId || !issueForm.bookCopyId) {
      showToast('warning', 'Validation Error', 'Please select both a user and a book copy');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/transactions/issue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(issueForm.userId),
          bookCopyId: parseInt(issueForm.bookCopyId),
          notes: issueForm.notes
        })
      });

      if (response.ok) {
        showToast('success', 'Book Issued', 'Book has been issued successfully');
        setShowIssueModal(false);
        setIssueForm({ userId: '', bookCopyId: '', notes: '' });
        loadAllTransactions();
      } else {
        const errorData = await response.json();
        showToast('error', 'Issue Failed', errorData.error || errorData.message || 'Failed to issue book');
      }
    } catch (error) {
      console.error('Error issuing book:', error);
      showToast('error', 'Issue Failed', 'Failed to issue book. Please try again.');
    }
  };

  const openIssueModal = () => {
    setShowIssueModal(true);
  };

  const isStaff = user?.role === 'Admin' || user?.role === 'Librarian';

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
                      placeholder="Search transactions by book title, author, user, or ISBN..."
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
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'RETURNED', label: 'Returned' },
                      { value: 'RENEWED', label: 'Renewed' },
                      { value: 'OVERDUE', label: 'Overdue' },
                      { value: 'LOST', label: 'Lost' },
                      { value: 'CANCELLED', label: 'Cancelled' }
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="Status"
                    className="w-32"
                  />

                  <button
                    onClick={() => {
                      setSelectedStatus('');
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

            {/* Transactions Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner message="Loading transactions..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/60">
                      <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <tr>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Book Details
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            User & Dates
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200/60">
                        {filteredTransactions().length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-8 py-12 text-center">
                              <EmptyState
                                icon={FiBook}
                                title="No transactions found"
                                description={searchTerm || selectedStatus ?
                                  "Try adjusting your search criteria or filters" :
                                  "No transactions available"}
                              />
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions().map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                              <td className="px-8 py-6">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                      {transaction.bookTitle}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      by {transaction.bookAuthor}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ISBN: {transaction.bookIsbn}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Barcode: {transaction.bookCopyBarcode}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-sm text-gray-900 font-medium">
                                  {transaction.userName}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Issued: {formatDate(transaction.issuedAt)}
                                </div>
                                <div className={`text-sm mt-1 ${transaction.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                  Due: {formatDate(transaction.dueDate)}
                                </div>
                                {transaction.returnedAt && (
                                  <div className="text-sm text-green-600 mt-1">
                                    Returned: {formatDate(transaction.returnedAt)}
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center mb-2">
                                  {getStatusBadge(transaction.status)}
                                </div>
                                {transaction.overdueDays > 0 && (
                                  <div className="text-sm text-red-600 font-medium mt-1">
                                    Overdue: {transaction.overdueDays} days
                                  </div>
                                )}
                                {transaction.fineAmount > 0 && (
                                  <div className="text-sm text-red-600 mt-1">
                                    Fine: ${transaction.fineAmount.toFixed(2)}
                                    {transaction.finePaid ? ' (Paid)' : ' (Unpaid)'}
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center space-x-3">

                                  {isStaff && transaction.status === 'ACTIVE' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setReturnForm({
                                            bookCopyId: transaction.bookCopyId.toString(),
                                            returnCondition: 'GOOD',
                                            notes: ''
                                          });
                                          setShowReturnModal(true);
                                        }}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                        title="Return Book"
                                      >
                                        <FiMinus className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => handleMarkAsLost(transaction.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                        title="Mark as Lost"
                                      >
                                        <FiXCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
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

      {/* Return Book Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Return Book"
        size="lg"
      >
        <div className="space-y-6">
          {/* Book Details Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiBook className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Information</h3>
                {(() => {
                  const transaction = allTransactions.find(t => t.bookCopyId.toString() === returnForm.bookCopyId);
                  return transaction ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{transaction.bookTitle}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Author</p>
                          <p className="text-sm text-gray-700 mt-1">{transaction.bookAuthor}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ISBN</p>
                          <p className="text-sm text-gray-700 mt-1 font-mono">{transaction.bookIsbn}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Borrowed By</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{transaction.userName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
                          <p className={`text-sm mt-1 font-medium ${new Date(transaction.dueDate) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                            {new Date(transaction.dueDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Barcode</p>
                          <p className="text-sm text-gray-700 mt-1 font-mono">{transaction.bookCopyBarcode}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">Book details not found</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Return Condition */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Return Condition <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Dropdown
                options={[
                  { value: 'NEW', label: '✨ New - Perfect condition' },
                  { value: 'GOOD', label: '👍 Good - Minor wear' },
                  { value: 'FAIR', label: '👌 Fair - Some damage' },
                  { value: 'POOR', label: '⚠️ Poor - Significant wear' },
                  { value: 'DAMAGED', label: '💔 Damaged - Needs repair' }
                ]}
                value={returnForm.returnCondition}
                onChange={(value) => setReturnForm({ ...returnForm, returnCondition: value as any })}
                placeholder="Select book condition"
                className="w-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Please assess the book's condition accurately. Damaged books may incur fines.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Additional Notes
            </label>
            <textarea
              value={returnForm.notes}
              onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Any additional notes about the book's condition or return..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowReturnModal(false)}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleReturnBook}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Confirm Return
          </button>
        </div>
      </Modal>

      {/* Issue Book Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Book"
        size="lg"
      >
        <div className="space-y-6">
          {/* User Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Select User
            </label>
            <Dropdown
              options={[]} // Empty since we're using dynamic search
              value={issueForm.userId}
              onChange={(value) => setIssueForm({ ...issueForm, userId: value })}
              placeholder="Choose a user to issue the book to"
              className="w-full"
              searchable={true}
              dynamicSearch={true}
              onSearch={searchUsers}
              searchPlaceholder="Search users by name or email..."
            />
          </div>

          {/* Book Copy Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Select Book Copy
            </label>
            <Dropdown
              options={[]} // Empty since we're using dynamic search
              value={issueForm.bookCopyId}
              onChange={(value) => setIssueForm({ ...issueForm, bookCopyId: value })}
              placeholder="Choose an available book copy"
              className="w-full"
              searchable={true}
              dynamicSearch={true}
              onSearch={searchAvailableCopies}
              searchPlaceholder="Search books by title, author, ISBN, or barcode..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Notes (Optional)
            </label>
            <textarea
              value={issueForm.notes}
              onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Any additional notes about the book issue..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowIssueModal(false)}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleIssueBook}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Issue Book
          </button>
        </div>
      </Modal>

      {/* Floating Action Buttons for Staff */}
      {isStaff && (
        <FloatingActionButton
          icon={FiBook}
          onClick={openIssueModal}
          title="Issue Book"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        />
      )}

      {/* Mark as Lost Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showLostConfirmModal}
        onClose={() => {
          setShowLostConfirmModal(false);
          setSelectedTransactionId(null);
        }}
        onConfirm={confirmMarkAsLost}
        itemName="this book"
        itemType="book"
        action="mark as lost"
        icon={<FiXCircle className="h-6 w-6 text-red-600" />}
        confirmButtonText="Mark as Lost"
        isLoading={isMarkingLost}
      />
    </div>
  );
};

export default Transactions;
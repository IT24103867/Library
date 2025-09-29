import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header } from '../components/dashboard';
import { LoadingSpinner, EmptyState, Pagination, Dropdown, FloatingActionButton, Modal, DeleteConfirmModal } from '../components/common';
import { useToast } from '../components/Toast';
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiBook, FiTag, FiMapPin, FiCalendar } from 'react-icons/fi';

// Types
interface BookCopy {
  id: number;
  bookId: number;
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'UNDER_REPAIR' | 'WITHDRAWN';
  barcode: string;
  isReferenceOnly: boolean;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  location: string;
  createdAt: string;
  updatedAt: string;
}

interface Book {
  id: number;
  title: string;
  isbn: string;
  authorName: string;
  publisherName: string;
}

const BookCopies: React.FC = () => {
  const { user } = useAuth();
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    barcode: '',
    status: 'AVAILABLE' as BookCopy['status'],
    isReferenceOnly: false,
    condition: 'GOOD' as BookCopy['condition'],
    location: ''
  });
  const [formError, setFormError] = useState('');

  // Status and condition options
  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'CHECKED_OUT', label: 'Checked Out' },
    { value: 'RESERVED', label: 'Reserved' },
    { value: 'LOST', label: 'Lost' },
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'UNDER_REPAIR', label: 'Under Repair' },
    { value: 'WITHDRAWN', label: 'Withdrawn' }
  ];

  const conditionOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
    { value: 'DAMAGED', label: 'Damaged' }
  ];

  // Fetch book details
  const fetchBook = useCallback(async () => {
    if (!bookId) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const bookData = await response.json();
        setBook(bookData);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    }
  }, [bookId]);

  // Fetch book copies
  const fetchBookCopies = useCallback(async () => {
    if (!bookId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/book-copies/by-book/${bookId}?page=${currentPage}&pageSize=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookCopies(data.content || data);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.length);
      }
    } catch (error) {
      console.error('Error fetching book copies:', error);
      showToast('error', 'Failed to load book copies');
    } finally {
      setLoading(false);
    }
  }, [bookId, currentPage, showToast]);

  useEffect(() => {
    fetchBook();
    fetchBookCopies();
  }, [fetchBook, fetchBookCopies]);

  // Modal handlers
  const handleAddCopy = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditCopy = (copy: BookCopy) => {
    setSelectedCopy(copy);
    setFormData({
      barcode: copy.barcode,
      status: copy.status,
      isReferenceOnly: copy.isReferenceOnly,
      condition: copy.condition,
      location: copy.location || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteCopy = (copy: BookCopy) => {
    setSelectedCopy(copy);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      status: 'AVAILABLE',
      isReferenceOnly: false,
      condition: 'GOOD',
      location: ''
    });
    setFormError('');
  };

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) return;

    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = selectedCopy
        ? `http://localhost:8080/api/book-copies/${selectedCopy.id}`
        : 'http://localhost:8080/api/book-copies';

      const method = selectedCopy ? 'PATCH' : 'POST';

      const requestData = selectedCopy
        ? { ...formData, bookId: parseInt(bookId) }
        : { ...formData, bookId: parseInt(bookId) };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        showToast('success', `Book copy ${selectedCopy ? 'updated' : 'added'} successfully`);
        setShowAddModal(false);
        setShowEditModal(false);
        fetchBookCopies();
        resetForm();
      } else {
        const error = await response.text();
        setFormError(error || 'Failed to save book copy');
      }
    } catch (error) {
      console.error('Error saving book copy:', error);
      setFormError('Failed to save book copy');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCopy) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/book-copies/${selectedCopy.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('success', 'Book copy deleted successfully');
        setShowDeleteModal(false);
        fetchBookCopies();
      } else {
        showToast('error', 'Failed to delete book copy');
      }
    } catch (error) {
      console.error('Error deleting book copy:', error);
      showToast('error', 'Failed to delete book copy');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: BookCopy['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'CHECKED_OUT': return 'bg-blue-100 text-blue-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'DAMAGED': return 'bg-orange-100 text-orange-800';
      case 'UNDER_REPAIR': return 'bg-purple-100 text-purple-800';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: BookCopy['condition']) => {
    switch (condition) {
      case 'NEW': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800';
      case 'POOR': return 'bg-orange-100 text-orange-800';
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!bookId) {
    return <div>Invalid book ID</div>;
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
          onProfileClick={() => {}}
        />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="w-full p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/books')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back to Books"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Book Copies</h1>
                    {book && (
                      <p className="text-lg text-gray-600 mt-1">
                        {book.title} - {book.isbn}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Total Copies: {totalElements}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Copies Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl">
              {loading ? (
                <LoadingSpinner message="Loading book copies..." />
              ) : bookCopies.length === 0 ? (
                <EmptyState
                  icon={FiBook}
                  title="No Book Copies"
                  description="This book doesn't have any copies yet. Add the first copy to get started."
                  actionButton={{
                    label: "Add First Copy",
                    onClick: handleAddCopy
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Copy Details
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status & Condition
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/60">
                      {bookCopies.map((copy) => (
                        <tr key={copy.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  <FiTag className="inline w-4 h-4 mr-2" />
                                  {copy.barcode}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  ID: {copy.id}
                                </div>
                                {copy.isReferenceOnly && (
                                  <div className="text-xs text-blue-600 mt-1 font-medium">
                                    Reference Only
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-2">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(copy.status)}`}>
                                {copy.status.replace('_', ' ')}
                              </span>
                              <div>
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConditionColor(copy.condition)}`}>
                                  {copy.condition}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              <FiMapPin className="inline w-4 h-4 mr-2" />
                              {copy.location || 'Not specified'}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              <FiCalendar className="inline w-4 h-4 mr-2" />
                              {new Date(copy.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEditCopy(copy)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit Copy"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCopy(copy)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete Copy"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {bookCopies.length > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={handleAddCopy}
        icon={FiPlus}
        title="Add Book Copy"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={showEditModal ? 'Edit Book Copy' : 'Add Book Copy'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode *
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter barcode"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <Dropdown
                options={statusOptions}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as BookCopy['status'] }))}
                placeholder="Select status"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <Dropdown
                options={conditionOptions}
                value={formData.condition}
                onChange={(value) => setFormData(prev => ({ ...prev, condition: value as BookCopy['condition'] }))}
                placeholder="Select condition"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter location (optional)"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isReferenceOnly"
              checked={formData.isReferenceOnly}
              onChange={(e) => setFormData(prev => ({ ...prev, isReferenceOnly: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isReferenceOnly" className="ml-2 block text-sm text-gray-700">
              Reference only (cannot be checked out)
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {showEditModal ? 'Update Copy' : 'Add Copy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={`book copy with barcode "${selectedCopy?.barcode}"`}
        itemType="Book Copy"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BookCopies;
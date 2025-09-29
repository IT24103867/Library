import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header } from '../components/dashboard';
import { SearchBar, LoadingSpinner, EmptyState, Pagination, FloatingActionButton, Modal, DeleteConfirmModal } from '../components/common';
import { useToast } from '../components/Toast';
import { FiHome, FiPlus, FiEdit, FiTrash2, FiCalendar, FiMail, FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';

// Types
interface Publisher {
  id: number;
  name: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  picture?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const Publishers: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    website: '',
    description: '',
    picture: null as File | null
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Debounce search term changes
  useEffect(() => {
    setIsSearchDebouncing(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearchDebouncing(false);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch publishers
  const fetchPublishers = useCallback(async (page: number = 0, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = debouncedSearchTerm
        ? `http://localhost:8080/api/publishers/search?query=${encodeURIComponent(debouncedSearchTerm)}&page=${page}&pageSize=10`
        : `http://localhost:8080/api/publishers?page=${page}&pageSize=10`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (!res.ok) {
        console.error('Failed to fetch publishers - Status:', res.status);
        setPublishers([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();
      setPublishers(data.content || data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching publishers:', error);
        setPublishers([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Initial load and search effect
  useEffect(() => {
    const controller = new AbortController();
    fetchPublishers(currentPage, controller.signal);

    return () => controller.abort();
  }, [fetchPublishers, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, picture: file }));
  };

  // CRUD Operations
  const submitAddPublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.contactNumber) formDataToSend.append('contactNumber', formData.contactNumber);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.website) formDataToSend.append('website', formData.website);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.picture) formDataToSend.append('picture', formData.picture);

      const response = await fetch('http://localhost:8080/api/publishers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowAddModal(false);
        const controller = new AbortController();
        fetchPublishers(currentPage, controller.signal);
        showToast('success', 'Publisher Added', `${formData.name} has been added successfully.`);
        resetForm();
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to add publisher');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditPublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublisher) return;

    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.contactNumber) formDataToSend.append('contactNumber', formData.contactNumber);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.website) formDataToSend.append('website', formData.website);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.picture) formDataToSend.append('picture', formData.picture);

      const response = await fetch(`http://localhost:8080/api/publishers/${selectedPublisher.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedPublisher(null);
        const controller = new AbortController();
        fetchPublishers(currentPage, controller.signal);
        showToast('success', 'Publisher Updated', `${formData.name} has been updated successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to update publisher');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeletePublisher = async () => {
    if (!selectedPublisher) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/publishers/${selectedPublisher.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedPublisher(null);
        const controller = new AbortController();
        fetchPublishers(currentPage, controller.signal);
        showToast('success', 'Publisher Deleted', 'The publisher has been deleted successfully.');
      } else {
        try {
          const errorData = await response.json();
          showToast('error', 'Failed to Delete Publisher', errorData.message || 'Please try again.');
        } catch {
          showToast('error', 'Failed to Delete Publisher', 'Please try again.');
        }
      }
    } catch (error) {
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const handleAddPublisher = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditPublisher = (publisher: Publisher) => {
    setSelectedPublisher(publisher);
    setFormData({
      name: publisher.name,
      address: publisher.address || '',
      contactNumber: publisher.contactNumber || '',
      email: publisher.email || '',
      website: publisher.website || '',
      description: publisher.description || '',
      picture: null
    });
    setShowEditModal(true);
  };

  const handleDeletePublisher = (publisher: Publisher) => {
    setSelectedPublisher(publisher);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      website: '',
      description: '',
      picture: null
    });
    setFormError('');
  };

  if (!user) {
    return <div>Loading...</div>;
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
            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <SearchBar
                      placeholder="Search publishers by name..."
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
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : publishers.length === 0 ? (
              <EmptyState
                icon={FiHome}
                title="No Publishers Found"
                description={searchTerm ? "No publishers match your search criteria." : "Get started by adding your first publisher."}
                actionButton={{
                  label: "Add Publisher",
                  onClick: handleAddPublisher
                }}
              />
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Publisher
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Website
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-8 py-6 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/40">
                      {publishers.map((publisher) => (
                        <tr key={publisher.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {publisher.picture ? (
                                  <img
                                    className="h-12 w-12 rounded-lg object-cover"
                                    src={`http://localhost:8080${publisher.picture}`}
                                    alt={publisher.name}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                    <FiHome className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {publisher.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {publisher.id}
                                </div>
                                {publisher.description && (
                                  <div className="text-sm text-gray-600 mt-1 max-w-xs truncate">
                                    {publisher.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              {publisher.email && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <FiMail className="w-4 h-4 mr-2 text-gray-500" />
                                  {publisher.email}
                                </div>
                              )}
                              {publisher.contactNumber && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                                  {publisher.contactNumber}
                                </div>
                              )}
                              {publisher.address && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <FiMapPin className="w-4 h-4 mr-2 text-gray-500" />
                                  {publisher.address}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {publisher.website ? (
                              <a
                                href={publisher.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FiGlobe className="w-4 h-4 mr-2" />
                                Visit Website
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">Not provided</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              <FiCalendar className="inline w-4 h-4 mr-2" />
                              {new Date(publisher.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleEditPublisher(publisher)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit Publisher"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePublisher(publisher)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete Publisher"
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <FloatingActionButton
        onClick={handleAddPublisher}
        icon={FiPlus}
        title="Add Publisher"
      />

      {/* Add Publisher Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Publisher"
      >
        <form onSubmit={submitAddPublisher} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter publisher name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? 'Adding...' : 'Add Publisher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Publisher Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Publisher"
      >
        <form onSubmit={submitEditPublisher} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter publisher name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedPublisher(null);
                resetForm();
              }}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? 'Updating...' : 'Update Publisher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeletePublisher}
        itemName={selectedPublisher?.name || ''}
        itemType="Publisher"
        isLoading={formLoading}
      />
    </div>
  );
};

export default Publishers;
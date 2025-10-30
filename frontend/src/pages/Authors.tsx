import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import { SearchBar, LoadingSpinner, EmptyState, Pagination, FloatingActionButton, Modal, DeleteConfirmModal } from '../components/common';
import { useToast } from '../components/Toast';
import { FiUser, FiPlus, FiEdit, FiTrash2, FiSearch, FiCalendar, FiBookOpen } from 'react-icons/fi';

// Types
interface Author {
  id: number;
  name: string;
  biography: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

const Authors: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [authors, setAuthors] = useState<Author[]>([]);
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
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    biography: '',
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
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch authors
  const fetchAuthors = useCallback(async (page: number = 0, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = debouncedSearchTerm
        ? `http://localhost:8080/api/authors/search?query=${encodeURIComponent(debouncedSearchTerm)}&page=${page}&pageSize=10`
        : `http://localhost:8080/api/authors?page=${page}&pageSize=10`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (!res.ok) {
        console.error('Failed to fetch authors - Status:', res.status);
        setAuthors([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();
      setAuthors(data.content || data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching authors:', error);
        setAuthors([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Initial load and search effect
  useEffect(() => {
    const controller = new AbortController();
    fetchAuthors(currentPage, controller.signal);

    return () => controller.abort();
  }, [fetchAuthors, currentPage]);

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
  const submitAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('biography', formData.biography);
      if (formData.picture) formDataToSend.append('picture', formData.picture);

      const response = await fetch('http://localhost:8080/api/authors', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowAddModal(false);
        const controller = new AbortController();
        fetchAuthors(currentPage, controller.signal);
        showToast('success', 'Author Added', `${formData.name} has been added successfully.`);
        resetForm();
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to add author');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuthor) return;

    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('biography', formData.biography);
      if (formData.picture) formDataToSend.append('picture', formData.picture);

      const response = await fetch(`http://localhost:8080/api/authors/${selectedAuthor.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedAuthor(null);
        const controller = new AbortController();
        fetchAuthors(currentPage, controller.signal);
        showToast('success', 'Author Updated', `${formData.name} has been updated successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to update author');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteAuthor = async () => {
    if (!selectedAuthor) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/authors/${selectedAuthor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedAuthor(null);
        const controller = new AbortController();
        fetchAuthors(currentPage, controller.signal);
        showToast('success', 'Author Deleted', 'The author has been deleted successfully.');
      } else {
        try {
          const errorData = await response.json();
          showToast('error', 'Failed to Delete Author', errorData.message || 'Please try again.');
        } catch {
          showToast('error', 'Failed to Delete Author', 'Please try again.');
        }
      }
    } catch (error) {
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const handleAddAuthor = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditAuthor = (author: Author) => {
    setSelectedAuthor(author);
    setFormData({
      name: author.name,
      biography: author.biography,
      picture: null
    });
    setShowEditModal(true);
  };

  const handleDeleteAuthor = (author: Author) => {
    setSelectedAuthor(author);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      biography: '',
      picture: null
    });
    setFormError('');
  };

  // Search handler (no longer needed with direct SearchBar binding)
  // const handleSearch = (query: string) => {
  //   setSearchTerm(query);
  //   setCurrentPage(0);
  // };

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
                      placeholder="Search authors by name..."
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

            {/* Authors Table */}
            {loading ? (
              <LoadingSpinner message="Loading authors..." />
            ) : authors.length === 0 ? (
              <EmptyState
                icon={FiUser}
                title="No Authors Found"
                description={searchTerm ? "No authors match your search criteria." : "Get started by adding your first author."}
                actionButton={{ label: "Add Author", onClick: handleAddAuthor }}
              />
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                      <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <tr>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Author
                          </th>
                          <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Biography
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
                      {authors.map((author) => (
                        <tr key={author.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {author.picture ? (
                                  <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={`http://localhost:8080${author.picture}`}
                                    alt={author.name}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                    <FiUser className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {author.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {author.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {author.biography}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              <FiCalendar className="inline w-4 h-4 mr-2" />
                              {new Date(author.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleEditAuthor(author)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit Author"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAuthor(author)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete Author"
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
        onClick={handleAddAuthor}
        icon={FiPlus}
        title="Add Author"
      />

      {/* Add Author Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Author"
      >
        <form onSubmit={submitAddAuthor} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

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
              placeholder="Enter author name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biography *
            </label>
            <textarea
              name="biography"
              value={formData.biography}
              onChange={handleFormChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter author biography"
              required
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
              {formLoading ? 'Adding...' : 'Add Author'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Author Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Author"
      >
        <form onSubmit={submitEditAuthor} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

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
              placeholder="Enter author name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biography *
            </label>
            <textarea
              name="biography"
              value={formData.biography}
              onChange={handleFormChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter author biography"
              required
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
                setSelectedAuthor(null);
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
              {formLoading ? 'Updating...' : 'Update Author'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAuthor}
        itemName={selectedAuthor?.name || ''}
        itemType="Author"
        isLoading={formLoading}
      />
    </div>
  );
};

export default Authors;

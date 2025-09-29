import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header } from '../components/dashboard';
import { SearchBar, LoadingSpinner, EmptyState, Pagination, FloatingActionButton, Modal, DeleteConfirmModal } from '../components/common';
import { useToast } from '../components/Toast';
import { FiGlobe, FiPlus, FiEdit, FiTrash2, FiCalendar } from 'react-icons/fi';

// Types
interface Language {
  id: number;
  name: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

const Languages: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    code: ''
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


  // Fetch languages
  const fetchLanguages = useCallback(async (page: number = 0, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = debouncedSearchTerm
        ? `http://localhost:8080/api/languages/search?query=${encodeURIComponent(debouncedSearchTerm)}&page=${page}&pageSize=10`
        : `http://localhost:8080/api/languages?page=${page}&pageSize=10`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (!res.ok) {
        console.error('Failed to fetch languages - Status:', res.status);
        setLanguages([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();
      setLanguages(data.content || data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching languages:', error);
        setLanguages([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Initial load and search changes
  useEffect(() => {
    const controller = new AbortController();
    fetchLanguages(currentPage, controller.signal);
    return () => controller.abort();
  }, [fetchLanguages, currentPage]);

  // Handlers
  const handleAddLanguage = () => {
    setFormData({ name: '', code: '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEditLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setFormData({
      name: language.name,
      code: language.code || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDeleteLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '' });
    setFormError('');
  };

  // CRUD Operations
  const submitAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchLanguages(currentPage);
        showToast('success', 'Language Added', `${formData.name} has been added successfully.`);
        resetForm();
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to add language');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLanguage) return;

    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/languages/${selectedLanguage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedLanguage(null);
        fetchLanguages(currentPage);
        showToast('success', 'Language Updated', `${formData.name} has been updated successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to update language');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteLanguage = async () => {
    if (!selectedLanguage) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/languages/${selectedLanguage.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedLanguage(null);
        fetchLanguages(currentPage);
        showToast('success', 'Language Deleted', 'The language has been deleted successfully.');
      } else {
        try {
          const errorData = await response.json();
          showToast('error', 'Failed to Delete Language', errorData.message || 'Please try again.');
        } catch {
          showToast('error', 'Failed to Delete Language', 'Please try again.');
        }
      }
    } catch (error) {
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
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
                                                   placeholder="Search Languages..."
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
                                             <FloatingActionButton
                                                             onClick={handleAddLanguage}
                                                             icon={FiPlus}
                                                             title="Add Language"
                                                           />

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : languages.length === 0 ? (
              <EmptyState
                icon={FiGlobe}
                title="No Languages Found"
                description={searchTerm ? "No languages match your search criteria." : "Get started by adding your first language."}
                actionButton={{ label: "Add Language", onClick: handleAddLanguage }}
              />
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Language
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-8 py-6 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/60">
                      {languages.map((language) => (
                        <tr key={language.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FiGlobe className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {language.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {language.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              {language.code || '-'}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-900">
                              <FiCalendar className="inline w-4 h-4 mr-2" />
                              {new Date(language.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleEditLanguage(language)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit Language"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLanguage(language)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete Language"
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
                {languages.length > 0 && (
                  <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing page <span className="font-semibold text-gray-900">{currentPage + 1}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="justify-end"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Language Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Language"
      >
        <form onSubmit={submitAddLanguage} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter language name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., EN, SI, TA"
              maxLength={10}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {formLoading ? 'Adding...' : 'Add Language'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Language Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Language"
      >
        <form onSubmit={submitEditLanguage} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter language name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., EN, SI, TA"
              maxLength={10}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {formLoading ? 'Updating...' : 'Update Language'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteLanguage}
        itemName={selectedLanguage?.name || ''}
        itemType="language"
        isLoading={formLoading}
      />
    </div>
  );
};

export default Languages;
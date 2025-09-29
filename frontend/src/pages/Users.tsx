import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import {
  SearchBar,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  UserAvatar,
  Pagination,
  Dropdown,
  FloatingActionButton,
  UserFormModal,
  DeleteConfirmModal
} from '../components/common';
import { useToast } from '../components/Toast';
import { FiUsers, FiUserPlus, FiEdit, FiTrash2, FiMail, FiCalendar } from 'react-icons/fi';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

const Users: React.FC = () => {
  const getImageUrl = (pictureUrl?: string) => {
    if (!pictureUrl) return undefined;
    const fileName = pictureUrl.split('/').pop();
    return `http://localhost:8080/api/users/image/${fileName}`;
  };

  const { user } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'MEMBER',
    status: 'ACTIVE'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Search cache and debouncing
  const searchCache = useRef(new Map<string, any>());
  const searchTimeoutRef = useRef<number | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
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
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  // --- Standard fetch with AbortController; no dev-only guards ---
  const fetchUsers = useCallback(async (page: number, signal: AbortSignal) => {
    // Only search if search term is at least 2 characters or empty
    const effectiveSearchTerm = debouncedSearchTerm.trim();
    if (effectiveSearchTerm && effectiveSearchTerm.length < 2) {
      setUsers([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10'
      });

      if (effectiveSearchTerm) {
        params.append('search', effectiveSearchTerm);
      }
      if (selectedRole) {
        params.append('role', selectedRole);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      // Create cache key
      const cacheKey = `${page}-${effectiveSearchTerm}-${selectedRole}-${selectedStatus}`;

      // Check cache first
      if (searchCache.current.has(cacheKey)) {
        const cachedData = searchCache.current.get(cacheKey);
        setUsers(cachedData.content || cachedData);
        setTotalPages(cachedData.totalPages || 1);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://localhost:8080/api/users?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }, signal }
      );

      if (!res.ok) {
        console.error('Failed to fetch users - Status:', res.status);
        console.error('Error response:', await res.text());
        setUsers([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();

      // Cache the result
      searchCache.current.set(cacheKey, data);

      // Limit cache size to prevent memory issues
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value;
        if (firstKey) {
          searchCache.current.delete(firstKey);
        }
      }

      setUsers(data.content || data);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching users:', err);
        setUsers([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedRole, selectedStatus]);

  // Single effect: runs on first mount and whenever currentPage or filters change
  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(currentPage, controller.signal);
    return () => controller.abort();
  }, [currentPage, fetchUsers]);

  // Clear search cache when data is modified
  const clearSearchCache = useCallback(() => {
    searchCache.current.clear();
  }, []);

  // CRUD Operations
  const handleAddUser = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'MEMBER',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // Not used for editing
      role: user.role,
      status: user.status
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitAddUser = async (e: React.FormEvent, formDataWithImage: FormData) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataWithImage
      });

      if (response.ok) {
        setShowAddModal(false);
        clearSearchCache();
        // refetch current page
        const controller = new AbortController();
        fetchUsers(currentPage, controller.signal);
        showToast('success', 'User Added', `${formData.name} has been added successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to add user');
        showToast('error', 'Failed to Add User', errorData.error || 'Please try again.');
      }
    } catch (error) {
      setFormError('Network error occurred');
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditUser = async (e: React.FormEvent, formDataWithImage: FormData) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataWithImage
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        clearSearchCache();
        const controller = new AbortController();
        fetchUsers(currentPage, controller.signal);
        showToast('success', 'User Updated', `${formData.name} has been updated successfully.`);
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to update user');
        showToast('error', 'Failed to Update User', errorData.message || 'Please try again.');
      }
    } catch (error) {
      setFormError('Network error occurred');
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        clearSearchCache();
        const controller = new AbortController();
        fetchUsers(currentPage, controller.signal);
        showToast('success', 'User Deleted', 'The user has been deleted successfully.');
      } else {
        console.error('Failed to delete user');
        showToast('error', 'Failed to Delete User', 'Please try again.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', 'Network Error', 'Please check your connection and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users;

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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="w-full p-8">
            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <SearchBar
                      placeholder="Search users by name, username, or email..."
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
                <div className="flex items-center space-x-4">
                  {/* Role Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Roles' },
                      { value: 'ADMIN', label: 'Admin' },
                      { value: 'LIBRARIAN', label: 'Librarian' },
                      { value: 'MEMBER', label: 'Member' }
                    ]}
                    value={selectedRole}
                    onChange={setSelectedRole}
                    placeholder="Select Role"
                    className="w-40"
                  />

                  {/* Status Filter */}
                  <Dropdown
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                      { value: 'PENDING', label: 'Pending' }
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="Select Status"
                    className="w-40"
                  />

                  <button
                    onClick={() => {
                      setSelectedRole('');
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

            {/* Users Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-visible transition-all duration-300 hover:shadow-3xl z-5">
              {loading ? (
                <LoadingSpinner message="Loading users..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/60">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-8 py-6 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200/40">
                      {filteredUsers.map((u, index) => (
                        <tr
                          key={u.id}
                          className="hover:bg-blue-50 transition-colors duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserAvatar
                                src={getImageUrl(u.picture)}
                                name={u.name}
                                size="md"
                                className="mr-4"
                              />
                              <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                                  {u.name}
                                </div>
                                <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center hover:text-blue-700 transition-colors">
                              <FiMail className="mr-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              {u.email}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <StatusBadge status={u.role} type="role" />
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <StatusBadge status={u.status} type="status" />
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center hover:text-gray-700 transition-colors">
                              <FiCalendar className="mr-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleEditUser(u)}
                                className="text-blue-600 hover:text-blue-800 p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 group/btn hover:shadow-lg transform hover:scale-110"
                              >
                                <FiEdit className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="text-red-600 hover:text-red-800 p-3 rounded-xl hover:bg-red-50 transition-all duration-300 group/btn hover:shadow-lg transform hover:scale-110"
                              >
                                <FiTrash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredUsers.length === 0 && !loading && (
                <EmptyState
                  icon={FiUsers}
                  title="No users found"
                  description={searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first user.'}
                  actionButton={
                    !searchTerm
                      ? {
                          label: 'Add User',
                          onClick: () => handleAddUser()
                        }
                      : undefined
                  }
                  className="py-16"
                />
              )}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
                </span>
                <span className="text-gray-400">•</span>
                <span>
                  Page <span className="font-semibold text-gray-900">{currentPage + 1}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </span>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="justify-center sm:justify-end"
              />
            </div>
          </div>
        </main>

        <FloatingActionButton onClick={handleAddUser} icon={FiUserPlus} title="Add New User" />

        {/* Add User Modal */}
        <UserFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={submitAddUser}
          formData={formData}
          onFormChange={handleFormChange}
          isLoading={formLoading}
          error={formError}
        />

        {/* Edit User Modal */}
        <UserFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={submitEditUser}
          formData={formData}
          onFormChange={handleFormChange}
          isLoading={formLoading}
          error={formError}
          isEdit={true}
          existingImageUrl={selectedUser?.picture}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteUser}
          itemName={selectedUser?.name || ''}
          itemType="User"
          isLoading={formLoading}
        />

        <Footer />
      </div>
    </div>
  );
};

export default Users;

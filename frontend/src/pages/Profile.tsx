import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Footer } from '../components/dashboard';
import {
  LoadingSpinner,
  StatCard
} from '../components/common';
import { useToast } from '../components/Toast';
import {
  FiUser,
  FiMail,
  FiShield,
  FiCamera,
  FiEdit3,
  FiSave,
  FiX,
  FiBook,
  FiDollarSign,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  totalBooksBorrowed: number;
  currentBooksBorrowed: number;
  totalFines: number;
  outstandingFines: number;
}

interface UserStats {
  totalBooksBorrowed: number;
  currentBooksBorrowed: number;
  totalFines: number;
  outstandingFines: number;
  membershipDuration: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          name: data.name || '',
          email: data.email || '',
        });
      } else {
        showToast('error', 'Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('error', 'Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/stats`, {
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
    if (user?.id) {
      fetchProfile();
      fetchStats();
    }
  }, [user?.id]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        showToast('success', 'Profile Updated', 'Your profile has been updated successfully');
      } else {
        const errorData = await response.json();
        showToast('error', 'Update Failed', errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Error', 'Failed to update profile');
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Please select an image smaller than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, profilePicture: data.profilePicture } : null);
        showToast('success', 'Profile Picture Updated', 'Your profile picture has been updated successfully');
      } else {
        showToast('error', 'Upload Failed', 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showToast('error', 'Error', 'Failed to upload profile picture');
    }
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

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
              <LoadingSpinner message="Loading profile..." />
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account information and view your library activity</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Books Borrowed"
                  value={stats.totalBooksBorrowed.toString()}
                  icon={FiBook}
                  color="blue"
                />
                <StatCard
                  title="Currently Borrowed"
                  value={stats.currentBooksBorrowed.toString()}
                  icon={FiClock}
                  color="yellow"
                />
                <StatCard
                  title="Total Fines"
                  value={`Rs. ${stats.totalFines.toFixed(2)}`}
                  icon={FiDollarSign}
                  color="red"
                />
                <StatCard
                  title="Outstanding Fines"
                  value={`Rs. ${stats.outstandingFines.toFixed(2)}`}
                  icon={FiTrendingUp}
                  color={stats.outstandingFines > 0 ? "red" : "green"}
                />
              </div>
            )}

            {/* Profile Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture & Basic Info */}
              <div className="lg:col-span-1">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                  <div className="text-center">
                    {/* Profile Picture */}
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                        {profile?.profilePicture ? (
                          <img
                            src={`http://localhost:8080${profile.profilePicture}`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FiUser className="w-16 h-16 text-white" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <FiCamera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Basic Info */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile?.name || profile?.username}</h2>
                    <p className="text-gray-600 mb-4">@{profile?.username}</p>

                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <FiShield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{profile?.role}</span>
                    </div>

                    <div className="text-sm text-gray-500">
                      Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateProfile}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FiSave className="w-4 h-4 mr-2" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({
                              name: profile?.name || '',
                              email: profile?.email || '',
                            });
                          }}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <FiX className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Username (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiUser className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.username}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <FiUser className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{profile?.name || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-900">{profile?.email || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiShield className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.role}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Contact administrator to change role</p>
                    </div>

                    {/* Account Created */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                      <div className="flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FiClock className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
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

export default Profile;
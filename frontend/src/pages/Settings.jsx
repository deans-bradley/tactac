import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import { Avatar, Button, Input, Textarea, Modal } from '../components/common';
import { Camera, User, Mail, Lock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    bio: user?.bio || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Email form
  const [emailData, setEmailData] = useState({
    email: user?.email || '',
    currentPassword: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please select a valid image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await userApi.updateProfile({
        username: profileData.username !== user.username ? profileData.username : undefined,
        bio: profileData.bio,
        profileImage: profileImage
      });

      updateUser(response.data.data.user);
      toast.success('Profile updated');
      setProfileImage(null);
      setProfileImagePreview(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const response = await userApi.updateEmail(emailData.email, emailData.currentPassword);
      updateUser(response.data.data.user);
      toast.success('Email updated');
      setEmailData(prev => ({ ...prev, currentPassword: '' }));
    } catch (error) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await userApi.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password updated');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      await userApi.deleteAccount(deletePassword);
      toast.success('Account deleted');
      await logout();
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
                ${tab.id === 'danger' ? 'text-red-500' : ''}
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar
                    src={profileImagePreview || user?.profileImage}
                    alt={user?.username}
                    size="xl"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Profile Photo</p>
                  <p className="text-sm text-gray-500">JPEG, PNG, or WebP. Max 5MB.</p>
                </div>
              </div>

              <Input
                label="Username"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Your username"
              />

              <Textarea
                label="Bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
              />

              <Button type="submit" loading={profileLoading}>
                Save Changes
              </Button>
            </form>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <Input
                label="New Email"
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />

              <Input
                label="Current Password"
                type="password"
                value={emailData.currentPassword}
                onChange={(e) => setEmailData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
              />

              <Button type="submit" loading={emailLoading}>
                Update Email
              </Button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
              />

              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter your new password"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
              />

              <p className="text-sm text-gray-500">
                Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.
              </p>

              <Button type="submit" loading={passwordLoading}>
                Update Password
              </Button>
            </form>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                <p className="text-red-600 text-sm mb-4">
                  Once you delete your account, there is no going back. All your posts, comments, and likes will be permanently deleted.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          This action cannot be undone. Please enter your password to confirm.
        </p>
        <Input
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          placeholder="Enter your password"
        />
        <div className="flex justify-end space-x-3 mt-4">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            loading={deleteLoading}
            disabled={!deletePassword}
          >
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
}

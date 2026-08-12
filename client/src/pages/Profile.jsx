import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, User, Lock, Save, Loader } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');

    try {
      await api.put('/auth/me/profile', { name });
      setProfileMessage('Profile updated successfully! Refresh the page to see changes globally.');
    } catch (err) {
      setProfileMessage(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      await api.put('/auth/me/password', { currentPassword, newPassword });
      setPasswordMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-shell profile-shell">
      <button onClick={() => navigate('/')} className="back-btn">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="page-header">
        <h1>Account Settings</h1>
      </div>

      <div className="profile-panel">
        <div className="document-card section-card" style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '1.25rem',
            }}
          >
            <User size={20} /> Profile Information
          </h2>

          {profileMessage && (
            <p
              style={{
                color: profileMessage.includes('successfully') ? 'var(--success-color)' : 'var(--danger-color)',
                marginBottom: '1rem',
              }}
            >
              {profileMessage}
            </p>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="input-group">
              <label>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <button type="submit" className="create-btn" disabled={profileLoading}>
              {profileLoading ? <Loader className="spin" size={16} /> : <Save size={16} />} Save Profile
            </button>
          </form>
        </div>

        <div className="document-card section-card">
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '1.25rem',
            }}
          >
            <Lock size={20} /> Change Password
          </h2>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
            }}
          >
            If you signed up with Google and don't have a password yet, leave Current Password blank.
          </p>

          {passwordMessage && (
            <p
              style={{
                color: passwordMessage.includes('successfully') ? 'var(--success-color)' : 'var(--danger-color)',
                marginBottom: '1rem',
              }}
            >
              {passwordMessage}
            </p>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>
            <button type="submit" className="create-btn" disabled={passwordLoading}>
              {passwordLoading ? <Loader className="spin" size={16} /> : <Save size={16} />} Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

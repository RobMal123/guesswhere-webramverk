import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  // Set initial mode based on URL
  const isResetMode = !!token;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch('http://localhost:8000/forgot-password', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }

      setMessage('If an account exists with this email, you will receive password reset instructions.');
      setEmail('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('new_password', newPassword);

      const response = await fetch(`http://localhost:8000/reset-password/${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setMessage('Password has been reset successfully. You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md">
        <div className="p-8 border shadow-xl backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl">
          <h2 className="mb-8 text-4xl font-bold text-center text-white">
            {isResetMode ? 'Reset Password' : 'Forgot Password'}
          </h2>
          
          {error && (
            <div className="p-4 mb-6 border bg-red-500/10 backdrop-blur-sm border-red-500/20 rounded-xl">
              <p className="font-medium text-center text-red-200">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="p-4 mb-6 border bg-green-500/10 backdrop-blur-sm border-green-500/20 rounded-xl">
              <p className="font-medium text-center text-green-200">{message}</p>
            </div>
          )}
          
          {!isResetMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-white border rounded-xl bg-white/10 border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/60"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                         bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                         text-white hover:shadow-lg transform hover:scale-[1.02]"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 text-white border rounded-xl bg-white/10 border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/60"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 text-white border rounded-xl bg-white/10 border-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/60"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                         bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                         text-white hover:shadow-lg transform hover:scale-[1.02]"
              >
                Reset Password
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm transition-colors text-white/80 hover:text-white"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset; 
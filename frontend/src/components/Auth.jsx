import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Authentication Component
 * Handles both user login and registration functionality with a toggle between the two modes.
 * 
 * Props:
 * @param {Function} onLogin - Callback function to handle successful authentication
 * @param {boolean} isRegister - Flag to determine initial mode (login/register)
 * 
 * Features:
 * - Toggle between login and registration forms
 * - Form validation
 * - Error handling and display
 * - Automatic login after registration
 * - Token-based authentication
 * - Navigation back to home
 */
function Auth({ onLogin, isRegister = false }) {
  const [isLogin, setIsLogin] = useState(!isRegister);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);

  /**
   * Handles form submission for both login and registration.
   * For registration: validates passwords match, creates account, then auto-logs in.
   * For login: authenticates user and stores token.
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match for registration
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      if (isLogin) {
        // Login request
        const formBody = new URLSearchParams();
        formBody.append('username', formData.username);
        formBody.append('password', formData.password);

        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Login failed');
        }

        // Store both token and user ID
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userId', data.user_id.toString());
        onLogin({ token: data.access_token });
      } else {
        // Registration request
        const response = await fetch('http://localhost:8000/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        // Automatically log in after successful registration
        const loginFormBody = new URLSearchParams();
        loginFormBody.append('username', formData.username);
        loginFormBody.append('password', formData.password);

        const loginResponse = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: loginFormBody
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          localStorage.setItem('token', loginData.access_token);
          localStorage.setItem('userId', loginData.user_id.toString());
          onLogin({ token: loginData.access_token });
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  /**
   * Handles form input changes and updates form state.
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          
          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl mb-6">
              <p className="text-red-200 font-medium text-center">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                         backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                         text-white placeholder-white/60"
                required
              />
            </div>
            
            {!isLogin && (
              <>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                             backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                             text-white placeholder-white/60"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                             backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                             text-white placeholder-white/60"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                             backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                             text-white placeholder-white/60"
                    required
                  />
                </div>
              </>
            )}
            
            {isLogin && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 
                           backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                           text-white placeholder-white/60"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                       text-white hover:shadow-lg transform hover:scale-[1.02]"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
              className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                       text-white hover:shadow-lg transform hover:scale-[1.02]"
            >
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign In'}
            </button>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={() => navigate('/')}
              className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                       text-white hover:shadow-lg transform hover:scale-[1.02]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;

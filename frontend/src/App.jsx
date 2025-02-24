import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Quiz from './components/Quiz';
import Admin from './components/Admin';
import './styles/main.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/check-admin', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setIsAdmin(userData.is_admin || false);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('token');
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData) => {
    if (userData) {
      setIsAuthenticated(true);
      setIsAdmin(userData.is_admin || false);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Location Guessing Game</h1>
          <div className="header-buttons">
            {isAdmin && (
              <button onClick={() => setShowAdmin(!showAdmin)}>
                {showAdmin ? 'Play Game' : 'Admin Dashboard'}
              </button>
            )}
            <button onClick={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setIsAdmin(false);
              setShowAdmin(false);
            }}>
              Logout
            </button>
          </div>
        </header>
        
        <main className="main-content">
          {showAdmin && isAdmin ? (
            <Admin />
          ) : (
            <>
              <div className="game-section">
                <Quiz />
              </div>
              <aside className="sidebar">
                <p>Leaderboard will go here</p>
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

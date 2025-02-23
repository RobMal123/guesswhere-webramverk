import React, { useState } from 'react';
import Auth from './components/Auth';
import Quiz from './components/Quiz';
import Admin from './components/Admin';
import './styles/main.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setIsAdmin(userData.is_admin);
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

import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Quiz from './components/Quiz';
import Admin from './components/Admin';
import Leaderboard from './components/Leaderboard';
import CategorySelection from './components/CategorySelection';
import './styles/main.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

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

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleGameComplete = (totalScore) => {
    setFinalScore(totalScore);
    setAverageScore(totalScore / 5);
    setGameComplete(true);
  };

  const startNewGame = () => {
    setGameComplete(false);
    setSelectedCategory(null);
    setFinalScore(0);
    setAverageScore(0);
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
            {!showAdmin && selectedCategory && (
              <button onClick={() => setSelectedCategory(null)}>
                Change Category
              </button>
            )}
            <button onClick={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setIsAdmin(false);
              setShowAdmin(false);
              setSelectedCategory(null);
            }}>
              Logout
            </button>
          </div>
        </header>
        
        <main className="main-content">
          {showAdmin && isAdmin ? (
            <Admin />
          ) : gameComplete ? (
            <div className="game-complete p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Game Complete!</h2>
                <p className="text-xl mb-2">Total Score: {finalScore}</p>
                <p className="text-lg mb-4">Average Score per Round: {Math.round(averageScore)}</p>
                <button 
                  onClick={startNewGame}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Play Again
                </button>
              </div>
              <div className="mt-8">
                <Leaderboard />
              </div>
            </div>
          ) : !selectedCategory ? (
            <CategorySelection onCategorySelect={handleCategorySelect} />
          ) : (
            <div className="game-section">
              <Quiz 
                category={selectedCategory} 
                onGameComplete={handleGameComplete}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

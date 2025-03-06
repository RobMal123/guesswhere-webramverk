import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, BrowserRouter, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Quiz from './components/Quiz';
import Admin from './components/Admin';
import Leaderboard from './components/Leaderboard';
import CategorySelection from './components/CategorySelection';
import Navbar from './components/Navbar';
import Friends from './components/Friends';
import Profile from './components/Profile';
import './styles/main.css';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const navigate = useNavigate();

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
            setIsLoggedIn(true);
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
      setIsLoggedIn(true);
      setIsAdmin(userData.is_admin || false);
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    navigate('/game');
  };

  const handleGameComplete = (totalScore) => {
    setFinalScore(totalScore);
    setAverageScore(totalScore / 5);
    setGameComplete(true);
    navigate('/game-complete');
  };

  const startNewGame = () => {
    setGameComplete(false);
    setSelectedCategory(null);
    setFinalScore(0);
    setAverageScore(0);
    navigate('/');
  };

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        isAdmin={isAdmin} 
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4">
        <Routes>
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
          <Route path="/game-complete" element={
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
          } />
          <Route path="/game" element={
            <Quiz 
              category={selectedCategory} 
              onGameComplete={handleGameComplete}
            />
          } />
          <Route path="/" element={
            <CategorySelection onCategorySelect={handleCategorySelect} />
          } />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={
            isLoggedIn ? <Profile /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

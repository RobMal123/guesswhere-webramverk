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
import LandingPage from './components/LandingPage';
import Challenges from './components/Challenges';
import ChallengeQuiz from './components/ChallengeQuiz';
import ChallengeResults from './components/ChallengeResults';

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

  const AppWrapper = ({ children }) => (
    <div className="relative min-h-screen">
      {/* World Map Background */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url('/src/assets/world-map.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Semi-transparent overlay for better readability */}
      <div className="fixed inset-0 bg-black/30" />

      {/* App Content */}
      <div className="relative z-10">
        {isLoggedIn && (
          <Navbar 
            isLoggedIn={isLoggedIn} 
            isAdmin={isAdmin} 
            onLogout={handleLogout}
          />
        )}
        <div className="container mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <AppWrapper>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth onLogin={handleLogin} />} />
          <Route path="/register" element={<Auth onLogin={handleLogin} isRegister={true} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <Routes>
        <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
        <Route path="/game-complete" element={
          <div className="relative z-10 p-8 w-full max-w-7xl mx-auto">
            <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl mb-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-white">Game Complete!</h2>
                <div className="space-y-4">
                  <p className="text-2xl text-white/90">Total Score: {finalScore}</p>
                  <p className="text-xl text-white/80">Average Score per Round: {Math.round(averageScore)}</p>
                  <button 
                    onClick={startNewGame}
                    className="px-8 py-4 rounded-xl font-medium transition-all duration-300
                             bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                             text-white hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    Play Again
                  </button>
                </div>
              </div>
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
        <Route path="/profile/:userId" element={
          isLoggedIn ? <Profile /> : <Navigate to="/login" />
        } />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenge-quiz/:challengeId" element={<ChallengeQuiz />} />
        <Route path="/challenge-results/:challengeId" element={<ChallengeResults />} />
      </Routes>
    </AppWrapper>
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

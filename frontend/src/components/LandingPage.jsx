import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
      <div className="max-w-4xl w-full text-center">
        {/* Main Content Container */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 md:p-12 shadow-xl">
          {/* Header */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="block text-white mb-2">Welcome to</span>
            <span className="flex items-center justify-center">
              <span className="text-white">Guess</span>
              <span className="mx-2 transform hover:rotate-12 inline-block transition-transform duration-300">📍</span>
              <span className="text-white">Where</span>
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-2xl text-white/80 mb-12">
            Test your geography knowledge and challenge your friends in this exciting location-guessing game!
          </p>

          {/* Game Modes Section */}
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Game Modes</h2>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
              {/* Solo Play Card */}
              <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 
                            transform hover:scale-105 transition-all duration-300 text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">🎯 Solo Play</h3>
                <p className="text-white/80 mb-4">Challenge yourself in various categories and improve your geography skills.</p>
                <ul className="text-white/70 list-disc list-inside space-y-2">
                  <li>Choose from different categories</li>
                  <li>Earn achievements</li>
                  <li>Track your high scores</li>
                </ul>
              </div>

              {/* Challenge Mode Card */}
              <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 
                            transform hover:scale-105 transition-all duration-300 text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">🤝 Challenge Mode</h3>
                <p className="text-white/80 mb-4">Compete head-to-head with friends in exciting location battles!</p>
                <ul className="text-white/70 list-disc list-inside space-y-2">
                  <li>Challenge friends to matches</li>
                  <li>5 rounds per player</li>
                  <li>Compare scores and see who wins</li>
                </ul>
              </div>
            </div>

            {/* How to Play Section */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">How to Play</h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Step 1 */}
              <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 
                            transform hover:scale-105 transition-all duration-300 text-left">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">1. Choose Category</h3>
                <p className="text-white/80">Select from various location categories like beaches, mountains, or cities.</p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 
                            transform hover:scale-105 transition-all duration-300 text-left">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">2. Guess Locations</h3>
                <p className="text-white/80">Look at the image and place your marker on the world map.</p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 
                            transform hover:scale-105 transition-all duration-300 text-left">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">3. Score Points</h3>
                <p className="text-white/80">Earn points based on accuracy and compete for the win!</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium transition-all duration-300
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                       text-white hover:shadow-lg transform hover:scale-[1.02]"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium transition-all duration-300
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                       text-white hover:shadow-lg transform hover:scale-[1.02]"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 
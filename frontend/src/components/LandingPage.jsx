import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-100 via-white to-blue-50">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 flex flex-col items-center">
          <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
            Welcome to
          </span>
          <span>
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Guess</span>
            📍
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Where</span>
          </span>
        </h1>
        
        <div className="mb-12">
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
            Test your geography knowledge in this exciting location-guessing game!
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">How to Play</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md transform hover:scale-105 transition-all duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-700">1. Choose a Category</h3>
              <p className="text-gray-600 leading-relaxed">Select from various location categories like beaches, mountains, or cities.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md transform hover:scale-105 transition-all duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-700">2. Guess Locations</h3>
              <p className="text-gray-600 leading-relaxed">Look at the image and place your marker on the world map where you think it is.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md transform hover:scale-105 transition-all duration-300">
              <h3 className="font-bold text-xl mb-3 text-blue-700">3. Score Points</h3>
              <p className="text-gray-600 leading-relaxed">Earn points based on how close your guess is to the actual location!</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-6">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg 
                     rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1 
                     transition-all duration-200 font-semibold"
          >
            Login to Play
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg 
                     rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1 
                     transition-all duration-200 font-semibold"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Navbar({ isLoggedIn, isAdmin, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const buttonClass = `
    px-4 py-2 text-sm font-medium rounded-xl
    bg-white/10 backdrop-blur-sm border border-white/20
    hover:bg-white/20 hover:shadow-lg
    transition-all duration-300 text-white
    flex items-center gap-2 transform hover:scale-[1.02]
  `;

  return (
    <nav className="sticky top-0 z-50 px-8 py-4 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button 
            className={`${buttonClass} border-blue-300/30 bg-blue-500/10 
                       hover:bg-blue-500/20`}
            onClick={() => navigate('/')}
          >
            <span className="text-lg">🎮</span>
            Play
          </button>
        </div>

        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">
              Guess
            </span>
            <span className="mx-1 transform hover:rotate-12 inline-block transition-transform duration-300">
              📍
            </span>
            <span className="text-white">
              Where
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <>
              <button className={`${buttonClass} hover:bg-blue-500/20`} onClick={() => navigate('/profile')}>
                <span className="text-lg">👤</span>
                Profile
              </button>
              <button className={`${buttonClass} hover:bg-blue-500/20`} onClick={() => navigate('/friends')}>
                <span className="text-lg">👥</span>
                Friends
              </button>
            </>
          )}
          {isAdmin && (
            <button 
              className={`${buttonClass} border-purple-300/30 bg-purple-500/10 
                         hover:bg-purple-500/20`} 
              onClick={() => navigate('/admin')}
            >
              <span className="text-lg">⚙️</span>
              Admin
            </button>
          )}
          <button 
            className={`${buttonClass} ${
              isLoggedIn 
                ? 'border-red-300/30 bg-red-500/10 hover:bg-red-500/20' 
                : 'hover:bg-blue-500/20'
            }`}
            onClick={isLoggedIn ? handleLogout : () => navigate('/login')}
          >
            <span className="text-lg">{isLoggedIn ? '🚪' : '🔑'}</span>
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
          <button 
            className={`${buttonClass} border-blue-300/30 bg-blue-500/10 
                       hover:bg-blue-500/20`}
            onClick={() => navigate('/challenges')}
          >
            <span className="text-lg">🤝</span>
            Challenges
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 
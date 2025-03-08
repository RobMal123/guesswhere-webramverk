import React from 'react';

function AchievementNotification({ achievement, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 bg-white p-4 rounded-lg shadow-lg animate-slide-in flex items-start gap-4 z-50 max-w-sm">
      <div className="flex-1">
        <h3 className="text-gray-800 mb-2 text-base font-semibold">
          🏆 Achievement Unlocked!
        </h3>
        <h4 className="text-gray-800 mb-1 text-sm font-medium">
          {achievement.name}
        </h4>
        <p className="text-gray-600 text-sm">
          {achievement.description}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 text-xl leading-none focus:outline-none"
      >
        ×
      </button>
    </div>
  );
}

export default AchievementNotification; 
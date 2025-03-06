import React from 'react';
import '../styles/AchievementNotification.css';

function AchievementNotification({ achievement, onClose }) {
  return (
    <div className="achievement-notification">
      <div className="achievement-content">
        <h3>🏆 Achievement Unlocked!</h3>
        <h4>{achievement.name}</h4>
        <p>{achievement.description}</p>
      </div>
      <button className="close-button" onClick={onClose}>×</button>
    </div>
  );
}

export default AchievementNotification; 
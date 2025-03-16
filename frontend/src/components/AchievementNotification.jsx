import React from 'react';

/**
 * AchievementNotification Component
 * Displays a toast-style notification when a user unlocks an achievement.
 * Features animated entrance, tier-based styling, and a close button.
 * 
 * Props:
 * @param {Object} achievement - The achievement data to display
 *   @param {string} achievement.name - Name of the achievement
 *   @param {string} achievement.description - Description of the achievement
 *   @param {number} achievement.points_required - Points required for the achievement
 * @param {number} totalNewAchievements - Total number of new achievements earned
 * @param {Function} onClose - Callback function to handle notification dismissal
 * @param {Function} onViewAll - Callback function to handle viewing all achievements
 */
function AchievementNotification({ achievement, totalNewAchievements, onClose, onViewAll }) {
  /**
   * Determines the visual styling based on achievement point requirements.
   * Returns different color schemes for different achievement tiers:
   * - Sky (Blue): 4750+ points - Highest tier
   * - Yellow: 4000-4749 points - High tier
   * - Gray: 3500-3999 points - Medium tier
   * - Amber: <3500 points - Base tier
   * 
   * @param {number} points - The points required for the achievement
   * @returns {Object} An object containing Tailwind CSS classes for different style elements
   */
  const getTierStyles = (points) => {
    if (points >= 4750) {
      return {
        background: 'from-sky-400 to-sky-500',
        border: 'border-sky-400/20',
        title: 'from-sky-100 to-white',
        heading: 'text-sky-100',
        text: 'text-sky-50/90',
        hover: 'hover:bg-sky-400/20',
        ring: 'focus:ring-sky-300 focus:ring-offset-sky-500'
      };
    }
    if (points >= 4000) {
      return {
        background: 'from-yellow-400 to-yellow-500',
        border: 'border-yellow-400/20',
        title: 'from-yellow-100 to-white',
        heading: 'text-yellow-100',
        text: 'text-yellow-50/90',
        hover: 'hover:bg-yellow-400/20',
        ring: 'focus:ring-yellow-300 focus:ring-offset-yellow-500'
      };
    }
    if (points >= 3500) {
      return {
        background: 'from-gray-400 to-gray-500',
        border: 'border-gray-400/20',
        title: 'from-gray-100 to-white',
        heading: 'text-gray-100',
        text: 'text-gray-50/90',
        hover: 'hover:bg-gray-400/20',
        ring: 'focus:ring-gray-300 focus:ring-offset-gray-500'
      };
    }
    return {
      background: 'from-amber-600 to-amber-700',
      border: 'border-amber-500/20',
      title: 'from-amber-100 to-white',
      heading: 'text-amber-100',
      text: 'text-amber-50/90',
      hover: 'hover:bg-amber-500/20',
      ring: 'focus:ring-amber-300 focus:ring-offset-amber-700'
    };
  };

  const styles = getTierStyles(achievement.points_required);

  return (
    <div className={`fixed bottom-5 right-5 bg-gradient-to-r ${styles.background} p-6 
                    rounded-xl shadow-2xl animate-slide-in flex flex-col gap-4 z-[9999] 
                    max-w-sm border ${styles.border} backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl animate-bounce">🏆</span>
            <h3 className={`text-lg font-bold bg-gradient-to-r ${styles.title} 
                         bg-clip-text text-transparent`}>
              Achievement Unlocked!
            </h3>
          </div>
          
          <h4 className={`text-base font-semibold mb-2 ${styles.heading}`}>
            {achievement.name}
          </h4>
          
          <p className={`text-sm ${styles.text} leading-relaxed`}>
            {achievement.description}
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 transition-colors duration-200 
                   w-6 h-6 flex items-center justify-center rounded-full 
                   focus:outline-none focus:ring-2 focus:ring-red-400 
                   focus:ring-offset-2 shadow-sm"
        >
          <span className="text-white text-xl leading-none">&times;</span>
        </button>
      </div>

      {/* Additional Achievements Info */}
      {totalNewAchievements > 1 && (
        <div className={`text-sm ${styles.text} mt-2`}>
          +{totalNewAchievements - 1} more {totalNewAchievements - 1 === 1 ? 'achievement' : 'achievements'} unlocked!
        </div>
      )}

      {/* View All Link */}
      <button
        onClick={onViewAll}
        className={`text-sm ${styles.text} mt-1 underline hover:no-underline 
                   transition-all duration-200 text-left`}
      >
        View all achievements →
      </button>
    </div>
  );
}

export default AchievementNotification; 
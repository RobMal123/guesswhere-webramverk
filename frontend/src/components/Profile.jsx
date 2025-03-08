import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
  const { userId } = useParams(); // Get userId from URL if viewing another user's profile
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const achievementTiers = {
    diamond: {
      name: "Diamond Tier",
      range: "4750-5000",
      styles: {
        background: 'from-sky-400 to-sky-500',
        border: 'border-sky-400/20',
        title: 'text-sky-100',
        text: 'text-sky-50/90'
      }
    },
    gold: {
      name: "Gold Tier",
      range: "4000-4750",
      styles: {
        background: 'from-yellow-400 to-yellow-500',
        border: 'border-yellow-400/20',
        title: 'text-yellow-100',
        text: 'text-yellow-50/90'
      }
    },
    silver: {
      name: "Silver Tier",
      range: "3500-4000",
      styles: {
        background: 'from-gray-400 to-gray-500',
        border: 'border-gray-400/20',
        title: 'text-gray-100',
        text: 'text-gray-50/90'
      }
    },
    bronze: {
      name: "Bronze Tier",
      range: "0-3500",
      styles: {
        background: 'from-amber-600 to-amber-700',
        border: 'border-amber-500/20',
        title: 'text-amber-100',
        text: 'text-amber-50/90'
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]); // Re-fetch when userId changes

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // If userId is provided, fetch that user's profile, otherwise fetch current user's profile
      const achievementsResponse = await fetch(
        userId 
          ? `http://localhost:8000/users/${userId}/achievements/`
          : 'http://localhost:8000/users/achievements/',
        { headers }
      );
      const achievementsData = await achievementsResponse.json();

      // Group achievements by tier
      const groupedAchievements = achievementsData.reduce((acc, achievement) => {
        const tier = getTierForPoints(achievement.achievement.points_required);
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(achievement);
        return acc;
      }, {});

      setAchievements(groupedAchievements);

      // If viewing another user's profile, fetch their basic info
      if (userId) {
        const userResponse = await fetch(`http://localhost:8000/users/${userId}`, { headers });
        const userData = await userResponse.json();
        setProfileUser(userData);
      }

      setLoading(false);
    } catch (error) {
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const getTierForPoints = (points) => {
    if (points >= 4750) return 'diamond';
    if (points >= 4000) return 'gold';
    if (points >= 3500) return 'silver';
    return 'bronze';
  };

  if (loading) return (
    <div className="text-center p-8 text-lg text-gray-600">Loading...</div>
  );
  
  if (error) return (
    <div className="text-center p-8 text-red-600">{error}</div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <div className="border-b-2 border-gray-100 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {profileUser ? `${profileUser.username}'s Profile` : 'Your Profile'}
        </h1>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h2>
        
        {Object.entries(achievementTiers).map(([tier, { name, range, styles }]) => (
          <div key={tier} className="mb-8">
            <h3 className={`text-xl font-semibold mb-4 pb-2 border-b 
              ${tier === 'diamond' ? 'text-sky-500' :
                tier === 'gold' ? 'text-yellow-500' :
                tier === 'silver' ? 'text-gray-600' :
                'text-amber-700'}`}
            >
              {name} ({range} points)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements[tier]?.map((achievement) => (
                <div 
                  key={achievement.achievement.id} 
                  className={`bg-gradient-to-r ${styles.background} p-6 rounded-xl 
                            shadow-lg transition-all duration-300 hover:shadow-xl 
                            border ${styles.border} backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏆</span>
                    <h4 className={`text-base font-semibold ${styles.title}`}>
                      {achievement.achievement.name}
                    </h4>
                  </div>
                  <p className={`${styles.text} text-sm leading-relaxed mb-3`}>
                    {achievement.achievement.description}
                  </p>
                  <span className={`text-xs ${styles.text} block opacity-75`}>
                    Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {!achievements[tier]?.length && (
                <p className="col-span-full text-center text-gray-500 italic py-4">
                  No achievements in this tier yet
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;

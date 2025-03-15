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
        background: 'bg-sky-400/10',
        border: 'border-sky-400/20',
        text: 'text-sky-100'
      }
    },
    gold: {
      name: "Gold Tier",
      range: "4000-4750",
      styles: {
        background: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
        text: 'text-yellow-100'
      }
    },
    silver: {
      name: "Silver Tier",
      range: "3500-4000",
      styles: {
        background: 'bg-gray-400/10',
        border: 'border-gray-400/20',
        text: 'text-gray-100'
      }
    },
    bronze: {
      name: "Bronze Tier",
      range: "0-3500",
      styles: {
        background: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-100'
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-2xl font-semibold text-white">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-2xl font-semibold text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="relative z-10">
      <div className="p-8 w-full max-w-7xl mx-auto">
        <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg">
          <div className="border-b border-white/20 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-white">
              {profileUser ? `${profileUser.username}'s Profile` : 'Your Profile'}
            </h1>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
            
            {Object.entries(achievementTiers).map(([tier, { name, range, styles }]) => (
              <div key={tier} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-white/20 text-white">
                  {name} ({range} points)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements[tier]?.map((achievement) => (
                    <div 
                      key={achievement.achievement.id} 
                      className="group relative flex flex-col p-6 rounded-xl 
                              transition-all duration-300 transform hover:scale-[1.02]
                              bg-white/10 hover:bg-white/20
                              shadow-lg hover:shadow-xl
                              backdrop-blur-sm border border-white/20"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🏆</span>
                        <h4 className="text-base font-semibold text-white">
                          {achievement.achievement.name}
                        </h4>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed mb-3">
                        {achievement.achievement.description}
                      </p>
                      <span className="text-xs text-white/75 block mt-auto">
                        Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {!achievements[tier]?.length && (
                    <p className="col-span-full text-center text-white/75 italic py-4">
                      No achievements in this tier yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

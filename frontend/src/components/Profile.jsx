import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
  const { userId } = useParams(); // Get userId from URL if viewing another user's profile
  const [userStats, setUserStats] = useState({
    averageScore: 0,
    totalGuesses: 0
  });
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

      // Fetch user stats
      const statsResponse = await fetch(
        userId 
          ? `http://localhost:8000/users/${userId}/stats/`
          : 'http://localhost:8000/users/stats/',
        { headers }
      );
      const statsData = await statsResponse.json();
      setUserStats(statsData);

      // Fetch achievements
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
      <div className="w-full p-8 mx-auto max-w-7xl">
        <div className="p-8 border shadow-lg backdrop-blur-sm bg-white/10 rounded-2xl border-white/20">
          <div className="pb-6 mb-8 border-b border-white/20">
            <h1 className="text-3xl font-bold text-white">
              {profileUser ? `${profileUser.username}'s Profile` : 'Your Profile'}
            </h1>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 border rounded-xl bg-white/10 border-white/20 backdrop-blur-sm">
              <h3 className="mb-2 text-sm font-medium text-white/80">Average Score</h3>
              <p className="text-2xl font-bold text-white">
                {userStats.averageScore.toFixed(2)}
              </p>
            </div>
            <div className="p-6 border rounded-xl bg-white/10 border-white/20 backdrop-blur-sm">
              <h3 className="mb-2 text-sm font-medium text-white/80">Total Guesses</h3>
              <p className="text-2xl font-bold text-white">
                {userStats.totalGuesses}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Achievements</h2>
            
            {Object.entries(achievementTiers).map(([tier, { name, range, styles }]) => (
              <div key={tier} className="mb-8">
                <h3 className="pb-2 mb-4 text-xl font-semibold text-white border-b border-white/20">
                  {name} ({range} points)
                </h3>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      <p className="mb-3 text-sm leading-relaxed text-white/90">
                        {achievement.achievement.description}
                      </p>
                      <span className="block mt-auto text-xs text-white/75">
                        Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {!achievements[tier]?.length && (
                    <p className="py-4 italic text-center col-span-full text-white/75">
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

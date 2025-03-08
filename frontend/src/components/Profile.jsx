import React, { useState, useEffect } from 'react';

function Profile() {
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const achievementTiers = {
    bronze: {
      name: "Bronze Tier",
      range: "0-3500",
      color: "#CD7F32"
    },
    silver: {
      name: "Silver Tier",
      range: "3500-4000",
      color: "#C0C0C0"
    },
    gold: {
      name: "Gold Tier",
      range: "4000-4750",
      color: "#FFD700"
    },
    diamond: {
      name: "Diamond Tier",
      range: "4750-5000",
      color: "#B9F2FF"
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch user achievements
      const achievementsResponse = await fetch('http://localhost:8000/users/achievements/', {
        headers
      });
      const achievementsData = await achievementsResponse.json();

      // Group achievements by tier
      const groupedAchievements = achievementsData.reduce((acc, achievement) => {
        const tier = getTierForPoints(achievement.achievement.points_required);
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(achievement);
        return acc;
      }, {});

      setAchievements(groupedAchievements);
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
        <h1 className="text-3xl font-bold text-gray-800">Your Profile</h1>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h2>
        
        {Object.entries(achievementTiers).map(([tier, { name, range, color }]) => (
          <div key={tier} className="mb-8">
            <h3 
              className={`text-xl font-semibold mb-4 pb-2 border-b ${
                tier === 'diamond' ? 'text-sky-500' :
                tier === 'gold' ? 'text-yellow-500' :
                tier === 'silver' ? 'text-gray-600' :
                'text-amber-700' // bronze
              }`}
            >
              {name} ({range} points)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements[tier]?.map((achievement) => (
                <div 
                  key={achievement.achievement.id} 
                  className="bg-white p-4 rounded-lg shadow transition-transform hover:scale-102"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {achievement.achievement.name}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {achievement.achievement.description}
                  </p>
                  <span className="text-xs text-gray-500 block">
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

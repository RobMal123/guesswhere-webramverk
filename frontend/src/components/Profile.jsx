import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';

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

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
      </div>

      <div className="achievements-section">
        <h2>Achievements</h2>
        {Object.entries(achievementTiers).map(([tier, { name, range, color }]) => (
          <div key={tier} className="achievement-tier">
            <h3 style={{ color }}>{name} ({range} points)</h3>
            <div className="achievements-grid">
              {achievements[tier]?.map((achievement) => (
                <div 
                  key={achievement.achievement.id} 
                  className="achievement-card"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <h4>{achievement.achievement.name}</h4>
                  <p>{achievement.achievement.description}</p>
                  <span className="earned-date">
                    Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {!achievements[tier]?.length && (
                <p className="no-achievements">No achievements in this tier yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;

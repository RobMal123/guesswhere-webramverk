import React, { useState, useEffect } from 'react';
import '../styles/Leaderboard.css';

function Leaderboard({ category }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:8000/leaderboard/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || `Failed to fetch leaderboard: ${response.status}`);
        }

        // Log the raw data to check what we're receiving
        console.log('Raw leaderboard data:', data);

        // Calculate average score for each entry
        const processedData = data.map(entry => {
          const averageScore = entry.games_played > 0 
            ? (entry.total_score / (entry.games_played * 5)) * 100 
            : 0;
          
          return {
            ...entry,
            average_score: Math.round(averageScore)
          };
        });

        // Log the processed data to verify calculations
        console.log('Processed leaderboard data:', processedData);

        setLeaderboardData(processedData);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">
          <p>Error loading leaderboard:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData.length) {
    return (
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">Leaderboard - {category || 'All Categories'}</h2>
        <p className="text-center text-gray-600">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Leaderboard - {category || 'All Categories'}</h2>
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Average Score</th>
              <th>Total Score</th>
              <th>Games</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr key={entry.id}>
                <td>#{index + 1}</td>
                <td>{entry.username}</td>
                <td>{entry.average_score}%</td>
                <td>{entry.total_score}</td>
                <td>{entry.games_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;

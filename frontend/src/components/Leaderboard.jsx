import React, { useState, useEffect } from 'react';

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
      <div className="bg-white rounded-2xl p-8 shadow-lg mx-auto my-8 max-w-4xl">
        <h2 className="text-xl font-semibold text-center text-blue-700 mb-6">
          Leaderboard - {category || 'All Categories'}
        </h2>
        <p className="text-center text-gray-600">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg mx-auto my-8 max-w-4xl">
      <h2 className="text-xl font-semibold text-center text-blue-700 mb-6">
        Leaderboard - {category || 'All Categories'}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">
                Player
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">
                Average Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">
                Total Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">
                Games
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboardData.map((entry, index) => (
              <tr 
                key={entry.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                  {entry.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {entry.average_score}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {entry.total_score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {entry.games_played}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;

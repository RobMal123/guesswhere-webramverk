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

        setLeaderboardData(data);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-white">
        Loading leaderboard...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl">
        <p className="text-red-200 font-medium text-center">
          Error loading leaderboard: {error}
        </p>
      </div>
    </div>
  );

  if (!leaderboardData.length) {
    return (
      <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg mx-auto my-8 max-w-4xl">
        <h2 className="text-2xl font-semibold text-center text-white mb-6">
          Leaderboard - {category || 'All Categories'}
        </h2>
        <p className="text-center text-white/60">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg mx-auto my-8 max-w-4xl">
      <h2 className="text-2xl font-semibold text-center text-white mb-6">
        Leaderboard - {category || 'All Categories'}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10">
                Player
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10">
                Highest Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider border-b border-white/10">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leaderboardData.map((entry, index) => (
              <tr 
                key={entry.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {entry.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                  {entry.highest_score}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                  {new Date(entry.last_updated).toLocaleDateString()}
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

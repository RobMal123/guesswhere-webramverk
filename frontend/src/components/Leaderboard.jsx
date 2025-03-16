import React, { useState, useEffect } from 'react';

function Leaderboard({ category: initialCategory }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');

  useEffect(() => {
    // Fetch categories when component mounts
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories/');
        const data = await response.json();
        
        // Filter out the "challenge" category and add "all" option
        const filteredCategories = data.filter(category => 
          category.name.toLowerCase() !== 'challenge'
        );
        
        setCategories([
          { id: 'all', name: 'All Categories' },
          ...filteredCategories
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
        const response = await fetch(`http://localhost:8000/leaderboard/${categoryParam}`, {
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

        setLeaderboardData(data);
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedCategory]);

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

  return (
    <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg mx-auto my-8 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-white">
          Top 10 Players
        </h2>
        
        {/* Category Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="category" className="text-white/80">
            Category:
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 
                     focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm
                     [&>option]:bg-gray-800 [&>option]:text-white"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            {categories.map(cat => (
              <option 
                key={cat.id} 
                value={cat.id === 'all' ? 'all' : cat.name}
                className="bg-gray-800 text-white py-2"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {!leaderboardData.length ? (
        <p className="text-center text-white/60">No scores recorded yet for this category.</p>
      ) : (
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
      )}
    </div>
  );
}

export default Leaderboard;

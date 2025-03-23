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

        // Group scores by category when showing all categories
        if (selectedCategory === 'all') {
          const groupedData = data.reduce((acc, entry) => {
            if (!acc[entry.category_name]) {
              acc[entry.category_name] = [];
            }
            acc[entry.category_name].push(entry);
            return acc;
          }, {});
          setLeaderboardData(groupedData);
        } else {
          // For single category, wrap the data in an object with category name as key
          setLeaderboardData({
            [selectedCategory]: data
          });
        }
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
      <div className="p-4 border bg-red-500/10 backdrop-blur-sm border-red-500/20 rounded-xl">
        <p className="font-medium text-center text-red-200">
          Error loading leaderboard: {error}
        </p>
      </div>
    </div>
  );

  const renderLeaderboardTable = (data, categoryName = null) => (
    <div className="mb-8 last:mb-0">
      {categoryName && (
        <h3 className="mb-4 text-xl font-semibold text-white">
          {categoryName}
        </h3>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-4 text-sm font-semibold tracking-wider text-left uppercase border-b text-white/80 border-white/10">
                Rank
              </th>
              <th className="px-6 py-4 text-sm font-semibold tracking-wider text-left uppercase border-b text-white/80 border-white/10">
                Player
              </th>
              <th className="px-6 py-4 text-sm font-semibold tracking-wider text-left uppercase border-b text-white/80 border-white/10">
                Total Score
              </th>
              <th className="px-6 py-4 text-sm font-semibold tracking-wider text-left uppercase border-b text-white/80 border-white/10">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {Array.isArray(data) && data.map((entry, index) => (
              <tr 
                key={entry.id}
                className="transition-colors hover:bg-white/5"
              >
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white/60">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                  {entry.username}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white/60">
                  {entry.score.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white/60">
                  {new Date(entry.achieved_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl p-8 mx-auto my-8 border shadow-lg backdrop-blur-sm bg-white/10 rounded-2xl border-white/20">
      <div className="flex flex-col items-center justify-between gap-4 mb-8 md:flex-row">
        <h2 className="text-2xl font-semibold text-white">
          {selectedCategory === 'all' ? 'Top Scores by Category' : 'Top 10 Scores'}
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
                className="py-2 text-white bg-gray-800"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {Object.entries(leaderboardData).length === 0 ? (
        <p className="text-center text-white/60">No scores recorded yet.</p>
      ) : (
        Object.entries(leaderboardData).map(([categoryName, scores]) => (
          <div key={categoryName}>
            {renderLeaderboardTable(scores, selectedCategory === 'all' ? categoryName : null)}
          </div>
        ))
      )}
    </div>
  );
}

export default Leaderboard;

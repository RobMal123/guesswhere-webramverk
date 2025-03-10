import React, { useState, useEffect } from 'react';

function CategorySelection({ onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Icons mapping for different categories
  const categoryIcons = {
    'Landmarks': '🏛️',
    'Nature': '🌲',
    'Cities': '🌆',
    'Buildings': '🏢',
    'Parks': '🌳',
    'Beaches': '🏖️',
    'Mountains': '⛰️',
    'Castles': '🏰',
    'Bridges': '🌉',
  };

  // Descriptions for categories
  const categoryDescriptions = {
    'Landmarks': 'Famous buildings and monuments',
    'Nature': 'Natural landscapes and scenery',
    'Cities': 'Urban environments and cityscapes',
    'Buildings': 'Notable architectural structures',
    'Parks': 'Public parks and gardens',
    'Beaches': 'Coastal locations and beaches',
    'Mountains': 'Mountain ranges and peaks',
    'Castles': 'Historic castles and fortresses',
    'Bridges': 'Famous bridges and crossings',
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories/');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        // Filter out the "challenge" category and add the random option
        const filteredCategories = data.filter(category => 
          category.name.toLowerCase() !== 'challenge'
        );
        
        const categoriesWithRandom = [
          ...filteredCategories,
          { 
            id: 'random', 
            name: 'Random', 
            description: 'Random locations from all categories' 
          }
        ];
        
        setCategories(categoriesWithRandom);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className="text-center p-4">Loading categories...</div>;
  if (error) return <div className="text-center p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">
        Choose category
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.name)}
            className="group relative flex flex-col items-center justify-center p-6 h-40 rounded-2xl 
                     bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                     text-white transition-all duration-300 transform hover:scale-[1.02]
                     shadow-md hover:shadow-lg"
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-4xl mb-2 filter drop-shadow-md">
                {categoryIcons[category.name] || '🎲'}
              </span>
              <span className="text-lg font-bold filter drop-shadow-sm">
                {category.name}
              </span>
              <span className="text-sm text-center opacity-90 px-2">
                {categoryDescriptions[category.name] || `${category.name} locations`}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySelection; 
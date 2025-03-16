import React, { useState, useEffect } from 'react';

function CategorySelection({ onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Icons mapping for different categories
  const categoryIcons = {
    'Landmarks': '🏛️',
    'Nature': '🌲',
    'City': '🌆',
    'Building': '🏢',
    'Park': '🌳',
    'Beach': '🏖️',
    'Mountain': '⛰️',
    'Castle': '🏰',
    'Bridge': '🌉',
    'Harbor': '⚓',
    'River': '🌉',
    'Lake': '🌊',
    'Forest': '🌲',
    'Cave': '🕳️',
    'Island': '🏝️',
    
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Loading categories...
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-2xl font-semibold text-red-500">Error: {error}</div>
    </div>
  );

  return (
    <div className="relative z-10">
      <div className="p-8 w-full max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center text-white">
          Choose Your Adventure
        </h2>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.name)}
              className="group relative flex flex-col items-center justify-center p-8 h-48 
                       rounded-2xl transition-all duration-300 transform hover:scale-[1.02]
                       bg-white/10 hover:bg-white/20
                       shadow-lg hover:shadow-xl
                       backdrop-blur-sm border border-white/20"
            >
              {/* Glass effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 opacity-0 
                          group-hover:opacity-100 transition-opacity duration-300"/>

              {/* Content */}
              <div className="relative flex flex-col items-center space-y-3">
                <span className="text-5xl mb-2 transform transition-transform 
                             group-hover:scale-110 group-hover:-rotate-6 drop-shadow-lg">
                  {categoryIcons[category.name] || '🎲'}
                </span>
                <span className="text-xl font-semibold text-white tracking-wide
                             transition-all group-hover:tracking-wider drop-shadow-md">
                  {category.name}
                </span>
                <span className="text-sm text-center text-white/90 max-w-[200px] 
                             group-hover:text-white transition-colors leading-snug drop-shadow">
                  {categoryDescriptions[category.name] || `${category.name} locations`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategorySelection; 
import React, { useState, useEffect } from 'react';
import '../styles/CategorySelection.css';  // Make sure the styles are imported

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
        
        // Add the random option to the categories
        const categoriesWithRandom = [
          ...data,
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

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="category-selection-container">
      <h2 className="category-title">Choose category</h2>
      <div className="category-grid-container">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.name)}
            className="category-grid-button"
          >
            <div className="category-content">
              <span className="category-icon">
                {categoryIcons[category.name] || '🎲'}
              </span>
              <span className="category-name">{category.name}</span>
              <span className="category-description">
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
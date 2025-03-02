import React from 'react';
import '../styles/CategorySelection.css';  // Make sure the styles are imported

function CategorySelection({ onCategorySelect }) {
  const categories = [
    { 
      id: 'landmark', 
      name: 'Landmarks', 
      description: 'Famous buildings and monuments',
      icon: '🏛️'
    },
    { 
      id: 'nature', 
      name: 'Nature', 
      description: 'Natural landscapes and scenery',
      icon: '🌲'
    },
    { 
      id: 'city', 
      name: 'Cities', 
      description: 'Urban environments and cityscapes',
      icon: '🌆'
    },
    { 
      id: 'building', 
      name: 'Buildings', 
      description: 'Notable architectural structures',
      icon: '🏢'
    },
    { 
      id: 'park', 
      name: 'Parks', 
      description: 'Public parks and gardens',
      icon: '🌳'
    },
    { 
      id: 'beach', 
      name: 'Beaches', 
      description: 'Coastal locations and beaches',
      icon: '🏖️'
    },
    { 
      id: 'mountain', 
      name: 'Mountains', 
      description: 'Mountain ranges and peaks',
      icon: '⛰️'
    },
    { 
      id: 'castle', 
      name: 'Castles', 
      description: 'Historic castles and fortresses',
      icon: '🏰'
    },
    { 
      id: 'bridge', 
      name: 'Bridges', 
      description: 'Famous bridges and crossings',
      icon: '🌉'
    },
    { 
      id: 'random', 
      name: 'Random', 
      description: 'Random locations from all categories',
      icon: '🎲'
    }
  ];

  return (
    <div className="category-selection-container">
      <h2 className="category-title">Choose category</h2>
      <div className="category-grid-container">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="category-grid-button"
          >
            <div className="category-content">
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-description">{category.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySelection; 
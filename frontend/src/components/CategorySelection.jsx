import React from 'react';

function CategorySelection({ onCategorySelect }) {
  const categories = [
    { id: 'landmark', name: 'Landmarks', description: 'Famous buildings and monuments' },
    { id: 'nature', name: 'Nature', description: 'Natural landscapes and scenery' },
    { id: 'city', name: 'Cities', description: 'Urban environments and cityscapes' },
    { id: 'building', name: 'Buildings', description: 'Notable architectural structures' },
    { id: 'park', name: 'Parks', description: 'Public parks and gardens' },
    { id: 'beach', name: 'Beaches', description: 'Coastal locations and beaches' },
    { id: 'mountain', name: 'Mountains', description: 'Mountain ranges and peaks' },
    { id: 'castle', name: 'Castles', description: 'Historic castles and fortresses' },
    { id: 'bridge', name: 'Bridges', description: 'Famous bridges and crossings' },
    { id: 'random', name: 'Random', description: 'Random locations from all categories' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose a Category</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
          >
            <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
            <p className="text-gray-600">{category.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySelection; 
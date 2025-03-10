import React, { useState, useEffect } from 'react';

function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalGuesses: 0,
    averageScore: 0
  });
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [newLocation, setNewLocation] = useState({
    latitude: '',
    longitude: '',
    image: null,
    category_id: '',
    name: '',
    description: '',
    difficulty_level: 'medium',
    country: '',
    region: ''
  });
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: ''
  });
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    category_id: '',
    country: '',
    points_required: ''
  });
  const [achievements, setAchievements] = useState([]);

  const achievementTiers = {
    bronze: {
      name: "Bronze Tier",
      range: "0-3500",
      color: "#CD7F32"
    },
    silver: {
      name: "Silver Tier",
      range: "3500-4000",
      color: "#C0C0C0"
    },
    gold: {
      name: "Gold Tier",
      range: "4000-4750",
      color: "#FFD700"
    },
    diamond: {
      name: "Diamond Tier",
      range: "4750-5000",
      color: "#B9F2FF"
    }
  };

  const getTierForPoints = (points) => {
    if (points >= 4750) return 'diamond';
    if (points >= 4000) return 'gold';
    if (points >= 3500) return 'silver';
    return 'bronze';
  };

  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
    fetchAchievements();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch statistics
      const statsResponse = await fetch('http://localhost:8000/admin/stats', {
        headers
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch locations
      const locationsResponse = await fetch('http://localhost:8000/admin/locations', {
        headers
      });
      const locationsData = await locationsResponse.json();
      setLocations(locationsData);

      // Fetch users
      const usersResponse = await fetch('http://localhost:8000/admin/users', {
        headers
      });
      const usersData = await usersResponse.json();
      setUsers(usersData);

      setLoading(false);
    } catch (error) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/categories/');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch('http://localhost:8000/achievements/');
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!newLocation.name || !newLocation.latitude || !newLocation.longitude || !newLocation.image) {
        setError('Please fill in all fields');
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('latitude', newLocation.latitude);
      formData.append('longitude', newLocation.longitude);
      formData.append('category_id', newLocation.category_id);
      formData.append('name', newLocation.name);
      formData.append('description', newLocation.description);
      formData.append('difficulty_level', newLocation.difficulty_level.toLowerCase());
      formData.append('country', newLocation.country);
      formData.append('region', newLocation.region);
      formData.append('image', newLocation.image);

      // Debug log
      console.log('Submitting location:', {
        name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        category: newLocation.category_id,
        difficulty_level: newLocation.difficulty_level.toLowerCase(),
        image: newLocation.image?.name
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/locations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add location');
      }

      const data = await response.json();
      console.log('Location created:', data);

      // Reset form
      setNewLocation({
        latitude: '',
        longitude: '',
        image: null,
        category_id: '',
        name: '',
        description: '',
        difficulty_level: 'medium',
        country: '',
        region: ''
      });

      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

      await fetchDashboardData();
      setMessage('Location added successfully!');
    } catch (error) {
      console.error('Error adding location:', error);
      setError(error.message);
    }
  };

  const handleEditClick = (location) => {
    setEditingLocation({
      ...location,
      image: null // Reset image since we don't want to show the current image path
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('latitude', editingLocation.latitude);
      formData.append('longitude', editingLocation.longitude);
      formData.append('category_id', editingLocation.category_id);
      formData.append('name', editingLocation.name);
      formData.append('description', editingLocation.description);
      formData.append('difficulty_level', editingLocation.difficulty_level);
      formData.append('country', editingLocation.country);
      formData.append('region', editingLocation.region);
      
      if (editingLocation.image) {
        formData.append('image', editingLocation.image);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/admin/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update location');
      }

      // Refresh the locations data
      await fetchDashboardData();
      setEditingLocation(null);
      
      // Show success message
      setMessage('Location updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/admin/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Update the locations list after successful deletion
        setLocations(locations.filter(loc => loc.id !== locationId));
        // Update the stats
        setStats(prev => ({
          ...prev,
          totalLocations: prev.totalLocations - 1
        }));
      } else {
        throw new Error('Failed to delete location');
      }
    } catch (error) {
      setError('Failed to delete location');
      console.error('Error deleting location:', error);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/categories/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add category');
      }

      // Reset form and refresh categories
      setNewCategory({ name: '' });
      await fetchCategories();
      setMessage('Category added successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAchievementSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/achievements/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAchievement)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add achievement');
      }

      // Reset form and refresh achievements
      setNewAchievement({
        name: '',
        description: '',
        category_id: '',
        country: '',
        points_required: ''
      });
      await fetchAchievements();
      setMessage('Achievement added successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      {message && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm mb-2">Total Users</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm mb-2">Total Locations</h3>
          <p className="text-2xl font-bold">{stats.totalLocations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm mb-2">Total Guesses</h3>
          <p className="text-2xl font-bold">{stats.totalGuesses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm mb-2">Average Score</h3>
          <p className="text-2xl font-bold">{stats.averageScore.toFixed(2)}</p>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Manage Categories</h2>
        <div className="space-y-6">
          <div className="max-w-md">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  New Category Name:
                </label>
                <input
                  id="categoryName"
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Category
              </button>
            </form>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(category => (
                <div key={category.id} className="bg-gray-50 p-3 rounded-md text-center">
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Manage Achievements</h2>
        <div className="space-y-6">
          <div className="max-w-md">
            <form onSubmit={handleAchievementSubmit} className="space-y-4">
              <div>
                <label htmlFor="achievementName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name:
                </label>
                <input
                  id="achievementName"
                  type="text"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement({...newAchievement, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="achievementDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description:
                </label>
                <textarea
                  id="achievementDescription"
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="achievementCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional):
                </label>
                <select
                  id="achievementCategory"
                  value={newAchievement.category_id}
                  onChange={(e) => setNewAchievement({...newAchievement, category_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="achievementCountry" className="block text-sm font-medium text-gray-700 mb-1">
                  Country (optional):
                </label>
                <input
                  id="achievementCountry"
                  type="text"
                  value={newAchievement.country}
                  onChange={(e) => setNewAchievement({...newAchievement, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="achievementPoints" className="block text-sm font-medium text-gray-700 mb-1">
                  Points Required:
                </label>
                <input
                  id="achievementPoints"
                  type="number"
                  min="0"
                  max="5000"
                  value={newAchievement.points_required}
                  onChange={(e) => setNewAchievement({...newAchievement, points_required: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Achievement
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Achievement Tiers</h3>
            {Object.entries(achievementTiers).map(([tier, { name, range, color }]) => (
              <div key={tier} className="mb-4">
                <h4 className="text-gray-600 text-sm mb-2">{name} ({range} points)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {achievements
                    .filter(a => getTierForPoints(a.points_required) === tier)
                    .map(achievement => (
                      <div key={achievement.id} className="bg-gray-50 p-3 rounded-md text-center">
                        <h5 className="text-gray-600 text-sm mb-2">{achievement.name}</h5>
                        <p className="text-gray-500 text-sm">{achievement.description}</p>
                        <p className="text-gray-500 text-sm">Points Required: {achievement.points_required}</p>
                        {achievement.category_id && (
                          <p className="text-gray-500 text-sm">Category: {categories.find(c => c.id === achievement.category_id)?.name}</p>
                        )}
                        {achievement.country && <p className="text-gray-500 text-sm">Country: {achievement.country}</p>}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-sections">
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Add New Location</h2>
          <form onSubmit={handleLocationSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Location Name:
              </label>
              <input
                id="name"
                type="text"
                placeholder="Location Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude:
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="Latitude"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude:
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="Longitude"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category:
              </label>
              <select
                id="category"
                value={newLocation.category_id}
                onChange={(e) => setNewLocation({...newLocation, category_id: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description:
              </label>
              <textarea
                id="description"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level:
              </label>
              <select
                id="difficulty"
                value={newLocation.difficulty_level}
                onChange={(e) => setNewLocation({...newLocation, difficulty_level: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country:
              </label>
              <input
                id="country"
                type="text"
                value={newLocation.country}
                onChange={(e) => setNewLocation({...newLocation, country: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Region:
              </label>
              <input
                id="region"
                type="text"
                value={newLocation.region}
                onChange={(e) => setNewLocation({...newLocation, region: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image:
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Selected file:', file.name);
                    setNewLocation({...newLocation, image: file});
                  }
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Location
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Existing Locations</h2>
          <div className="space-y-4">
            {locations.map(location => (
              <div key={location.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img 
                    src={`http://localhost:8000/images/${location.image_url}`} 
                    alt="Location" 
                    className="w-16 h-16 rounded-md object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.src = 'https://via.placeholder.com/64'; // Fallback image
                    }}
                  />
                  <div>
                    <p className="text-gray-600 text-sm">{location.name}</p>
                    <p className="text-gray-500 text-sm">Lat: {location.latitude}</p>
                    <p className="text-gray-500 text-sm">Long: {location.longitude}</p>
                    <p className="text-gray-500 text-sm location-category">
                      Category: {location.category_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {editingLocation?.id === location.id ? (
                    <>
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        form="edit-location-form"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button"
                        onClick={() => handleEditClick(location)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Edit
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Users</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Username</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Total Score</th>
                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Join Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-4 text-sm text-gray-800">{user.username}</td>
                  <td className="px-4 py-4 text-sm text-gray-800">{user.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-800">{user.total_score}</td>
                  <td className="px-4 py-4 text-sm text-gray-800">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default Admin; 
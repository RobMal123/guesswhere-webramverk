import React, { useState, useEffect } from 'react';

/**
 * Admin Dashboard Component
 * Provides a comprehensive interface for managing the application's content and monitoring statistics.
 * 
 * Features:
 * - Dashboard statistics (users, locations, guesses, scores)
 * - Category management
 * - Achievement management with tier system
 * - Location management (CRUD operations)
 * - User overview
 */
function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalGuesses: 0,
    averageScore: 0
  });
  const [locations, setLocations] = useState([]);
  const [pendingLocations, setPendingLocations] = useState([]);
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

  /**
   * Determines the achievement tier based on points
   * @param {number} points - The points to evaluate
   * @returns {string} The tier name ('diamond', 'gold', 'silver', or 'bronze')
   */

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
    fetchPendingLocations();
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

  const fetchPendingLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/locations/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending locations');
      }
      const data = await response.json();
      setPendingLocations(data);
    } catch (error) {
      console.error('Error fetching pending locations:', error);
      setPendingLocations([]);
    }
  };

  /**
   * Handles the submission of a new location
   * Validates and uploads location data including image
   * @param {Event} e - The form submission event
   */

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

  const handleApproveLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/locations/pending/${locationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve location');
      }

      // Refresh both locations and pending locations
      await Promise.all([fetchDashboardData(), fetchPendingLocations()]);
      setMessage('Location approved successfully!');
    } catch (error) {
      console.error('Error approving location:', error);
      setError('Failed to approve location');
    }
  };

  const handleRejectLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/locations/pending/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject location');
      }

      await fetchPendingLocations();
      setMessage('Location rejected successfully!');
    } catch (error) {
      console.error('Error rejecting location:', error);
      setError('Failed to reject location');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="relative z-10">
      <div className="w-full p-8 mx-auto max-w-7xl">
        <div className="p-8 border shadow-lg backdrop-blur-sm bg-white/10 rounded-2xl border-white/20">
          {message && (
            <div className="p-4 mb-6 text-center text-green-200 border rounded-xl bg-green-500/10 border-green-500/20">
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 mb-6 text-center text-red-200 border rounded-xl bg-red-500/10 border-red-500/20">
              {error}
            </div>
          )}
          <h1 className="mb-6 text-3xl font-bold text-white">Admin Dashboard</h1>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 border rounded-xl bg-white/10 border-white/20">
              <h3 className="mb-2 text-sm text-white/90">Total Users</h3>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="p-6 border rounded-xl bg-white/10 border-white/20">
              <h3 className="mb-2 text-sm text-white/90">Total Locations</h3>
              <p className="text-2xl font-bold text-white">{stats.totalLocations}</p>
            </div>
            <div className="p-6 border rounded-xl bg-white/10 border-white/20">
              <h3 className="mb-2 text-sm text-white/90">Total Guesses</h3>
              <p className="text-2xl font-bold text-white">{stats.totalGuesses}</p>
            </div>
            <div className="p-6 border rounded-xl bg-white/10 border-white/20">
              <h3 className="mb-2 text-sm text-white/90">Average Score</h3>
              <p className="text-2xl font-bold text-white">{stats.averageScore.toFixed(2)}</p>
            </div>
          </div>

          {/* Pending Locations Section */}
          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Pending Locations</h2>
            {pendingLocations.length === 0 ? (
              <p className="text-white/70">No pending locations to review.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingLocations.map((location) => (
                  <div key={location.id} className="p-4 border rounded-xl bg-white/10 border-white/20">
                    <img
                      src={`http://localhost:8000/${location.image_url}`}
                      alt={location.name}
                      className="object-cover w-full h-48 mb-4 rounded-xl"
                    />
                    <h3 className="mb-2 text-lg font-semibold text-white">{location.name}</h3>
                    <p className="mb-2 text-white/70">{location.description}</p>
                    <div className="mb-4 text-sm text-white/70">
                      <p>Category: {categories.find(c => c.id === location.category_id)?.name}</p>
                      <p>Difficulty: {location.difficulty_level}</p>
                      <p>Country: {location.country}</p>
                      <p>Region: {location.region}</p>
                      <p>Submitted by: {users.find(u => u.id === location.user_id)?.username}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleRejectLocation(location.id)}
                        className="px-4 py-2 text-white transition-all duration-300 border rounded-xl bg-red-500/80 border-red-500/20 hover:bg-red-500/90"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveLocation(location.id)}
                        className="px-4 py-2 text-white transition-all duration-300 border rounded-xl bg-green-500/80 border-green-500/20 hover:bg-green-500/90"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add New Location Section */}
          <section className="p-6 mb-8 border rounded-xl bg-white/10 border-white/20">
            <h2 className="mb-6 text-2xl font-bold text-white">Add New Location</h2>
            <form onSubmit={handleLocationSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-white/90">
                  Location Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Location Name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="block mb-2 text-sm font-medium text-white/90">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newLocation.latitude}
                    onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                    required
                    className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block mb-2 text-sm font-medium text-white/90">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newLocation.longitude}
                    onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                    required
                    className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block mb-2 text-sm font-medium text-white/90">
                  Category
                </label>
                <select
                  id="category"
                  value={newLocation.category_id}
                  onChange={(e) => setNewLocation({...newLocation, category_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
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
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-white/90">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                  rows="3"
                />
              </div>
              <div>
                <label htmlFor="difficulty" className="block mb-2 text-sm font-medium text-white/90">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  value={newLocation.difficulty_level}
                  onChange={(e) => setNewLocation({...newLocation, difficulty_level: e.target.value})}
                  required
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label htmlFor="country" className="block mb-2 text-sm font-medium text-white/90">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={newLocation.country}
                  onChange={(e) => setNewLocation({...newLocation, country: e.target.value})}
                  required
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                />
              </div>
              <div>
                <label htmlFor="region" className="block mb-2 text-sm font-medium text-white/90">
                  Region
                </label>
                <input
                  id="region"
                  type="text"
                  value={newLocation.region}
                  onChange={(e) => setNewLocation({...newLocation, region: e.target.value})}
                  required
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                />
              </div>
              <div>
                <label htmlFor="image" className="block mb-2 text-sm font-medium text-white/90">
                  Image
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
                  className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-white hover:file:bg-blue-500/30"
                />
              </div>
              <div className="flex justify-end pt-4 space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 text-white transition-all duration-300 border rounded-xl bg-blue-500/80 border-blue-500/20 hover:bg-blue-500/90"
                >
                  Add Location
                </button>
              </div>
            </form>
          </section>

          {/* Rest of the sections with updated styling */}
          <section className="p-6 mb-8 border rounded-xl bg-white/10 border-white/20">
            <h2 className="mb-6 text-2xl font-bold text-white">Manage Categories</h2>
            <div className="space-y-6">
              <div className="max-w-md">
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="categoryName" className="block mb-2 text-sm font-medium text-white/90">
                      New Category Name
                    </label>
                    <input
                      id="categoryName"
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ name: e.target.value })}
                      required
                      className="w-full px-4 py-2 text-white border rounded-xl bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/50"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full px-6 py-2 text-white transition-all duration-300 border rounded-xl bg-blue-500/80 border-blue-500/20 hover:bg-blue-500/90"
                  >
                    Add Category
                  </button>
                </form>
              </div>
              
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Existing Categories</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {categories.map(category => (
                    <div key={category.id} className="p-3 text-center text-white border rounded-xl bg-white/10 border-white/20">
                      <span>{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Users Section */}
          <section className="p-6 mb-8 border rounded-xl bg-white/10 border-white/20">
            <h2 className="mb-6 text-2xl font-bold text-white">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-3 text-sm font-medium text-left text-white/90">Username</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white/90">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white/90">Total Score</th>
                    <th className="px-4 py-3 text-sm font-medium text-left text-white/90">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 text-sm text-white/90">{user.username}</td>
                      <td className="px-4 py-4 text-sm text-white/90">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-white/90">{user.total_score}</td>
                      <td className="px-4 py-4 text-sm text-white/90">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Admin; 
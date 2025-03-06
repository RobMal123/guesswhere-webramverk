import React, { useState, useEffect } from 'react';
import '../styles/Admin.css';

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
      formData.append('difficulty_level', newLocation.difficulty_level);
      formData.append('country', newLocation.country);
      formData.append('region', newLocation.region);
      formData.append('image', newLocation.image);

      // Debug log
      console.log('Submitting location:', {
        name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        category: newLocation.category_id,
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
    <div className="admin-dashboard">
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Locations</h3>
          <p>{stats.totalLocations}</p>
        </div>
        <div className="stat-card">
          <h3>Total Guesses</h3>
          <p>{stats.totalGuesses}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p>{stats.averageScore.toFixed(2)}</p>
        </div>
      </div>

      <section className="categories-section">
        <h2>Manage Categories</h2>
        <div className="categories-container">
          <div className="add-category-form">
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="categoryName">New Category Name:</label>
                <input
                  id="categoryName"
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Add Category</button>
            </form>
          </div>
          
          <div className="existing-categories">
            <h3>Existing Categories</h3>
            <div className="categories-grid">
              {categories.map(category => (
                <div key={category.id} className="category-card">
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="achievements-section">
        <h2>Manage Achievements</h2>
        <div className="achievements-container">
          <div className="add-achievement-form">
            <form onSubmit={handleAchievementSubmit}>
              <div className="form-group">
                <label htmlFor="achievementName">Name:</label>
                <input
                  id="achievementName"
                  type="text"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement({...newAchievement, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="achievementDescription">Description:</label>
                <textarea
                  id="achievementDescription"
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="achievementCategory">Category (optional):</label>
                <select
                  id="achievementCategory"
                  value={newAchievement.category_id}
                  onChange={(e) => setNewAchievement({...newAchievement, category_id: e.target.value})}
                >
                  <option value="">No specific category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="achievementCountry">Country (optional):</label>
                <input
                  id="achievementCountry"
                  type="text"
                  value={newAchievement.country}
                  onChange={(e) => setNewAchievement({...newAchievement, country: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="achievementPoints">Points Required:</label>
                <input
                  id="achievementPoints"
                  type="number"
                  min="0"
                  max="5000"
                  value={newAchievement.points_required}
                  onChange={(e) => setNewAchievement({...newAchievement, points_required: e.target.value})}
                  required
                />
              </div>
              <button type="submit">Add Achievement</button>
            </form>
          </div>

          <div className="existing-achievements">
            <h3>Achievement Tiers</h3>
            {Object.entries(achievementTiers).map(([tier, { name, range, color }]) => (
              <div key={tier} className="achievement-tier">
                <h4 style={{ color }}>{name} ({range} points)</h4>
                <div className="achievements-grid">
                  {achievements
                    .filter(a => getTierForPoints(a.points_required) === tier)
                    .map(achievement => (
                      <div key={achievement.id} className="achievement-card" style={{ borderLeft: `4px solid ${color}` }}>
                        <h4>{achievement.name}</h4>
                        <p>{achievement.description}</p>
                        <p>Points Required: {achievement.points_required}</p>
                        {achievement.category_id && (
                          <p>Category: {categories.find(c => c.id === achievement.category_id)?.name}</p>
                        )}
                        {achievement.country && <p>Country: {achievement.country}</p>}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-sections">
        <section className="locations-section">
          <h2>Add New Location</h2>
          <form onSubmit={handleLocationSubmit} className="add-location-form">
            <div className="form-group">
              <label htmlFor="name">Location Name:</label>
              <input
                id="name"
                type="text"
                placeholder="Location Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="latitude">Latitude:</label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="Latitude"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude:</label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="Longitude"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={newLocation.category_id}
                onChange={(e) => setNewLocation({...newLocation, category_id: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty Level:</label>
              <select
                id="difficulty"
                value={newLocation.difficulty_level}
                onChange={(e) => setNewLocation({...newLocation, difficulty_level: e.target.value})}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="country">Country:</label>
              <input
                id="country"
                type="text"
                value={newLocation.country}
                onChange={(e) => setNewLocation({...newLocation, country: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="region">Region:</label>
              <input
                id="region"
                type="text"
                value={newLocation.region}
                onChange={(e) => setNewLocation({...newLocation, region: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="image">Image:</label>
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
              />
            </div>
            <button type="submit">Add Location</button>
          </form>

          <h2>Existing Locations</h2>
          <div className="locations-grid">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <img src={`http://localhost:8000/${location.image_url}`} alt="Location" />
                {editingLocation?.id === location.id ? (
                  <form onSubmit={handleEditSubmit} className="edit-form">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={editingLocation.latitude}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        latitude: e.target.value
                      })}
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={editingLocation.longitude}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        longitude: e.target.value
                      })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Location Name"
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        name: e.target.value
                      })}
                      required
                    />
                    <select
                      value={editingLocation.category_id}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        category_id: e.target.value
                      })}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editingLocation.description}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        description: e.target.value
                      })}
                    />
                    <select
                      value={editingLocation.difficulty_level}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        difficulty_level: e.target.value
                      })}
                      required
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Country"
                      value={editingLocation.country}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        country: e.target.value
                      })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Region"
                      value={editingLocation.region}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        region: e.target.value
                      })}
                      required
                    />
                    <input
                      type="file"
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        image: e.target.files[0]
                      })}
                    />
                    <div className="edit-buttons">
                      <button type="submit" className="save-button">Save</button>
                      <button type="button" onClick={handleCancelEdit} className="cancel-button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>Name: {location.name}</p>
                    <p>Lat: {location.latitude}</p>
                    <p>Long: {location.longitude}</p>
                    <p className="location-category">
                      Category: {location.category_id}
                    </p>
                    <div className="location-buttons">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(location)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="users-section">
          <h2>Users</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Total Score</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.total_score}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
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
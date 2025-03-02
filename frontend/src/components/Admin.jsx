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
    category: 'landmark',
    name: ''
  });
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const categories = [
    'landmark',
    'nature',
    'city',
    'building',
    'park',
    'beach',
    'mountain',
    "castle",
    "bridge",
    'other'
  ];

  useEffect(() => {
    fetchDashboardData();
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
      formData.append('category', newLocation.category);
      formData.append('name', newLocation.name);
      formData.append('image', newLocation.image);

      // Debug log
      console.log('Submitting location:', {
        name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        category: newLocation.category,
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
        category: 'landmark',
        name: ''
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
      formData.append('category', editingLocation.category);
      formData.append('name', editingLocation.name);
      
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
                value={newLocation.category}
                onChange={(e) => setNewLocation({...newLocation, category: e.target.value})}
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
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
                      value={editingLocation.category}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        category: e.target.value
                      })}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
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
                      Category: {location.category.charAt(0).toUpperCase() + location.category.slice(1)}
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
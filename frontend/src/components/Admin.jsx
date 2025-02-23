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
    image: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const formData = new FormData();
      formData.append('latitude', newLocation.latitude);
      formData.append('longitude', newLocation.longitude);
      formData.append('image', newLocation.image);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/locations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
        setNewLocation({ latitude: '', longitude: '', image: null });
      }
    } catch (error) {
      setError('Failed to add location');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
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
          <form onSubmit={handleLocationSubmit}>
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={newLocation.latitude}
              onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={newLocation.longitude}
              onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
              required
            />
            <input
              type="file"
              onChange={(e) => setNewLocation({...newLocation, image: e.target.files[0]})}
              required
            />
            <button type="submit">Add Location</button>
          </form>

          <h2>Existing Locations</h2>
          <div className="locations-grid">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <img src={`http://localhost:8000/${location.image_url}`} alt="Location" />
                <p>Lat: {location.latitude}</p>
                <p>Long: {location.longitude}</p>
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
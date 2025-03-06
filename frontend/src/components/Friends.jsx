import React, { useState, useEffect } from 'react';
import '../styles/Friends.css';

function Friends() {
  const [friends, setFriends] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/friends/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      setError('Failed to fetch friends');
    }
  };

  const addFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/friends/add/${friendId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFriends();
        setSearchResults([]);
        setSearchUsername('');
      }
    } catch (error) {
      setError('Failed to add friend');
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/friends/remove/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      setError('Failed to remove friend');
    }
  };

  return (
    <div className="friends-container">
      <h2>Friends</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="friends-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
      </div>

      <div className="friends-list">
        {friends.map(friend => (
          <div key={friend.id} className="friend-card">
            <span>{friend.username}</span>
            <button onClick={() => removeFriend(friend.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Friends; 
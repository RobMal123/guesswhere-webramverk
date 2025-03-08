import React, { useState, useEffect } from 'react';

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
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Friends</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {friends.map(friend => (
          <div 
            key={friend.id} 
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-800 font-medium">
              {friend.username}
            </span>
            <button 
              onClick={() => removeFriend(friend.id)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
        {friends.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No friends added yet
          </p>
        )}
      </div>
    </div>
  );
}

export default Friends; 
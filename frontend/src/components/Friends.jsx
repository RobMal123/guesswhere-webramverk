import React, { useState, useEffect } from 'react';

function Friends() {
  const [friends, setFriends] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

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

  const searchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/users/search?username=${encodeURIComponent(searchUsername)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchUsers();
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
        await fetchFriends();
        setSearchResults(searchResults.filter(user => user.id !== friendId));
        if (searchResults.length <= 1) {
          setSearchUsername('');
        }
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
        await fetchFriends();
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
      
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={searchUsers}
          disabled={isSearching || !searchUsername.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors font-semibold disabled:bg-blue-400"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map(user => (
              <div 
                key={user.id}
                className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200"
              >
                <span className="text-gray-800">{user.username}</span>
                <button
                  onClick={() => addFriend(user.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                           transition-colors"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Friends</h3>
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
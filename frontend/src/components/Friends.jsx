import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Friends() {
  const [friends, setFriends] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

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

  const viewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-8 text-gray-800 text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
        Friends
      </h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
      
      {/* Search Box */}
      <div className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search users..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-blue-300 
                     transition-all text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={searchUsers}
            disabled={isSearching || !searchUsername.trim()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl
                     shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600
                     transition-all duration-200 font-semibold disabled:from-blue-300 
                     disabled:to-blue-200 disabled:shadow-none transform hover:-translate-y-0.5"
          >
            {isSearching ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Search Results
          </h3>
          <div className="space-y-3">
            {searchResults.map(user => (
              <div 
                key={user.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-xl
                         hover:bg-gray-100 transition-all duration-200"
              >
                <span className="text-gray-700 font-medium">{user.username}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => viewProfile(user.id)}
                    className="px-3 py-1.5 border border-blue-500 text-white bg-blue-500
                             rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all 
                             duration-200 font-medium text-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => addFriend(user.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-400 text-white 
                             rounded-lg hover:from-green-600 hover:to-green-500 transition-all 
                             duration-200 font-medium text-sm shadow-sm hover:shadow 
                             transform hover:-translate-y-0.5"
                  >
                    Add Friend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
          Your Friends
        </h3>
        <div className="space-y-3">
          {friends.map(friend => (
            <div 
              key={friend.id} 
              className="flex justify-between items-center p-4 bg-gray-50 rounded-xl
                       hover:bg-gray-100 transition-all duration-200"
            >
              <span className="text-gray-700 font-medium">
                {friend.username}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => viewProfile(friend.id)}
                  className="px-3 py-1.5 border border-blue-500 text-white bg-blue-500
                           rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all 
                           duration-200 font-medium text-sm"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => removeFriend(friend.id)}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-400 text-white 
                           rounded-lg hover:from-red-600 hover:to-red-500 transition-all 
                           duration-200 font-medium text-sm shadow-sm hover:shadow 
                           transform hover:-translate-y-0.5"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {friends.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 italic">
                No friends added yet. Use the search box above to find friends!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Friends; 
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
    <div className="relative z-10">
      <div className="p-8 w-full max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center text-white">
          Friends
        </h2>
        
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-200 font-medium text-center">{error}</p>
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
              className="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 
                       backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                       text-white placeholder-white/60 transition-all"
            />
            <button
              onClick={searchUsers}
              disabled={isSearching || !searchUsername.trim()}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl
                       backdrop-blur-sm border border-white/20 transition-all duration-300
                       disabled:opacity-50 disabled:hover:bg-white/10"
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
          <div className="mb-8 backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-semibold mb-4 text-white border-b border-white/20 pb-2">
              Search Results
            </h3>
            <div className="space-y-3">
              {searchResults.map(user => (
                <div 
                  key={user.id}
                  className="flex justify-between items-center p-4 bg-white/5 rounded-xl
                           hover:bg-white/10 transition-all duration-300"
                >
                  <span className="text-white font-medium">{user.username}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => viewProfile(user.id)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white
                               rounded-lg transition-all duration-300 text-sm
                               backdrop-blur-sm border border-white/20"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => addFriend(user.id)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-white 
                               rounded-lg transition-all duration-300 text-sm
                               backdrop-blur-sm border border-emerald-500/30"
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
        <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold mb-4 text-white border-b border-white/20 pb-2">
            Your Friends
          </h3>
          <div className="space-y-3">
            {friends.map(friend => (
              <div 
                key={friend.id} 
                className="flex justify-between items-center p-4 bg-white/5 rounded-xl
                         hover:bg-white/10 transition-all duration-300"
              >
                <span className="text-white font-medium">
                  {friend.username}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => viewProfile(friend.id)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white
                             rounded-lg transition-all duration-300 text-sm
                             backdrop-blur-sm border border-white/20"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => removeFriend(friend.id)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white 
                             rounded-lg transition-all duration-300 text-sm
                             backdrop-blur-sm border border-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/60 italic">
                  No friends added yet. Use the search box above to find friends!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Friends; 
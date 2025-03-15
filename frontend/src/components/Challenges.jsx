import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [currentUser, setCurrentUser] = useState(null);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user info first
    fetchCurrentUser().then(() => {
      fetchChallenges();
      fetchFriends();
    });
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/check-admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Store the current user ID for comparison
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/challenges/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      
      const data = await response.json();
      console.log('Fetched challenges:', data);
      setChallenges(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/friends/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const createChallenge = async () => {
    if (!selectedFriend) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/?friend_id=${selectedFriend}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create challenge');
      }
      
      await fetchChallenges();
      setSelectedFriend(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const respondToChallenge = async (challengeId, accept) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (accept) {
        // Accept the challenge
        const response = await fetch(`http://localhost:8000/challenges/${challengeId}/respond?accept=${accept}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to respond to challenge');
        }
        
        // Start the challenge
        const startResponse = await fetch(`http://localhost:8000/challenges/${challengeId}/start`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (startResponse.ok) {
          navigate(`/challenge-quiz/${challengeId}`);
        } else {
          const startErrorData = await startResponse.json();
          throw new Error(startErrorData.detail || 'Failed to start challenge');
        }
      } else {
        // Delete the challenge instead of declining it
        const response = await fetch(`http://localhost:8000/challenges/${challengeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete challenge');
        }
      }
      
      await fetchChallenges();
    } catch (error) {
      console.error('Error responding to challenge:', error);
      setError(error.message);
    }
  };

  const startChallenge = async (challengeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/${challengeId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start challenge');
      }
      
      navigate(`/challenge-quiz/${challengeId}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const viewResults = (challengeId) => {
    navigate(`/challenge-results/${challengeId}`);
  };

  const canPlayTurn = (challenge) => {
    // Get the number of rounds completed by the current user
    const userScores = results?.scores?.filter(score => 
      score.user_id === parseInt(localStorage.getItem('userId'))
    ) || [];
    
    return challenge.status === 'in_progress' && userScores.length < 5;
  };

  const deleteChallenge = async (challengeId) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete challenge');
      }
      
      await fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      setError(error.message);
    }
  };

  // Filter challenges based on active tab
  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === 'pending') {
      return challenge.status === 'pending';
    } else if (activeTab === 'active') {
      return challenge.status === 'accepted' || challenge.status === 'in_progress';
    } else if (activeTab === 'completed') {
      return challenge.status === 'completed';
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Loading challenges...
      </div>
    </div>
  );

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Challenges
      </h1>
      
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/20 text-red-700">
          {error}
        </div>
      )}
      
      {/* Create Challenge Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-xl mb-8">
        <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Challenge a Friend
        </h2>
        <div className="flex flex-wrap gap-4">
          <select 
            className="flex-1 p-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            value={selectedFriend || ''}
            onChange={(e) => setSelectedFriend(e.target.value)}
          >
            <option value="">Select a friend</option>
            {friends.map(friend => (
              <option key={friend.id} value={friend.id}>
                {friend.username}
              </option>
            ))}
          </select>
          <button 
            onClick={createChallenge}
            disabled={!selectedFriend}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 
                     text-white rounded-xl shadow-lg hover:shadow-blue-500/30 
                     transform hover:scale-[1.02] transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Send Challenge
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'active', 'completed'].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform
              ${activeTab === tab 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg scale-[1.02] outline outline-2 outline-black' 
                : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 hover:text-white'
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Challenge List */}
      <div className="space-y-4">
        {filteredChallenges.length === 0 ? (
          <div className="text-center p-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            No {activeTab} challenges found
          </div>
        ) : (
          filteredChallenges.map(challenge => {
            const isChallenger = challenge.challenger_id === parseInt(localStorage.getItem('userId'));
            const otherUser = isChallenger ? challenge.challenged.username : challenge.challenger.username;
            
            return (
              <div key={challenge.id} 
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl
                          transform hover:scale-[1.01] transition-all duration-300 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium text-white">
                      {isChallenger ? `You challenged ${otherUser}` : `${otherUser} challenged you`}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {new Date(challenge.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium
                      ${challenge.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                        challenge.status === 'accepted' ? 'bg-blue-400/10 text-blue-400' :
                        challenge.status === 'in_progress' ? 'bg-purple-400/10 text-purple-400' :
                        'bg-green-400/10 text-green-400'}`}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </span>
                    
                    {(activeTab === 'active' || activeTab === 'completed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChallenge(challenge.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center
                                   rounded-full bg-red-500/10 hover:bg-red-500/20 
                                   text-red-400 hover:text-red-300 transition-all duration-200"
                        title="Delete challenge"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {challenge.status === 'pending' && !isChallenger && (
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => respondToChallenge(challenge.id, true)}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 
                               text-white rounded-xl shadow-lg hover:shadow-green-500/30 
                               transform hover:scale-[1.02] transition-all duration-300"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToChallenge(challenge.id, false)}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 
                               text-white rounded-xl shadow-lg hover:shadow-red-500/30 
                               transform hover:scale-[1.02] transition-all duration-300"
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                {challenge.status === 'accepted' && (
                  <button 
                    onClick={() => startChallenge(challenge.id)}
                    className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 
                             text-white rounded-xl shadow-lg hover:shadow-blue-500/30 
                             transform hover:scale-[1.02] transition-all duration-300"
                  >
                    Start Challenge
                  </button>
                )}
                
                {challenge.status === 'completed' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-center p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800">
                      {challenge.winner_id ? (
                        <span className={`font-medium ${
                          challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                            ? '🏆 You won!' 
                            : '💔 You lost!'}
                        </span>
                      ) : (
                        <span className="font-medium text-yellow-400">🤝 It's a draw!</span>
                      )}
                    </div>
                    <button 
                      onClick={() => viewResults(challenge.id)}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-700 
                               text-white rounded-xl shadow-lg hover:shadow-purple-500/30 
                               transform hover:scale-[1.02] transition-all duration-300"
                    >
                      View Results
                    </button>
                  </div>
                )}
                
                {challenge.status === 'in_progress' && (
                  <button 
                    onClick={() => navigate(`/challenge-quiz/${challenge.id}`)}
                    className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 
                             text-white rounded-xl shadow-lg hover:shadow-blue-500/30 
                             transform hover:scale-[1.02] transition-all duration-300"
                  >
                    Play Your Turn
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Challenges;

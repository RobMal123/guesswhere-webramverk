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
      setError(null); // Clear any previous errors
      
      const token = localStorage.getItem('token');
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
      
      await fetchChallenges();
      
      if (accept) {
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
      }
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

  if (loading) return <div className="text-center p-8">Loading challenges...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Challenges</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Create Challenge Section */}
      <div className="bg-blue-50 p-6 rounded-xl mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Challenge a Friend</h2>
        <div className="flex flex-wrap gap-4">
          <select 
            className="flex-1 p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                     rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 
                     disabled:from-blue-300 disabled:to-blue-400 disabled:cursor-not-allowed"
          >
            Send Challenge
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'pending' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'active' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'completed' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>
      
      {/* Challenge List */}
      <div className="space-y-4">
        {filteredChallenges.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No {activeTab} challenges found.</p>
        ) : (
          filteredChallenges.map(challenge => {
            // Determine if the current user is the challenger or the challenged
            const isChallenger = challenge.challenger_id === parseInt(localStorage.getItem('userId'));
            const otherUser = isChallenger ? challenge.challenged.username : challenge.challenger.username;
            
            return (
              <div key={challenge.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-medium">
                      {isChallenger 
                        ? `You challenged ${otherUser}`
                        : `${otherUser} challenged you`}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      on {new Date(challenge.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    challenge.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    challenge.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                  </span>
                </div>
                
                {/* Only show accept/decline buttons if the current user is the one being challenged */}
                {challenge.status === 'pending' && !isChallenger && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => respondToChallenge(challenge.id, true)}
                      className="flex-1 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToChallenge(challenge.id, false)}
                      className="flex-1 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                {challenge.status === 'accepted' && (
                  <button 
                    onClick={() => startChallenge(challenge.id)}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mt-3"
                  >
                    Start Challenge
                  </button>
                )}
                
                {challenge.status === 'completed' && (
                  <div className="mt-3">
                    <div className="text-center mb-2">
                      {challenge.winner_id ? (
                        <span className={`font-medium ${
                          challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                            ? 'You won!' 
                            : 'You lost!'}
                        </span>
                      ) : (
                        <span className="font-medium text-yellow-600">It's a draw!</span>
                      )}
                    </div>
                    <button 
                      onClick={() => viewResults(challenge.id)}
                      className="w-full py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      View Results
                    </button>
                  </div>
                )}
                
                {challenge.status === 'in_progress' && (
                  <button 
                    onClick={() => navigate(`/challenge-quiz/${challenge.id}`)}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mt-3"
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

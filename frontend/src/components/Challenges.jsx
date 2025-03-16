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
      <div className="text-2xl font-semibold text-white">
        Loading challenges...
      </div>
    </div>
  );

  return (
    <div className="relative z-10">
      <div className="p-8 w-full max-w-7xl mx-auto">
        <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Challenges
          </h1>
          
          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl mb-6">
              <p className="text-red-200 font-medium text-center">
                {error}
              </p>
            </div>
          )}
          
          {/* Create Challenge Section */}
          <div className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Challenge a Friend
            </h2>
            <div className="flex flex-wrap gap-4">
              <select 
                className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 
                         backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 
                         text-white"
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
                className="px-8 py-4 rounded-xl font-medium transition-all duration-300
                         bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                         text-white hover:shadow-lg transform hover:scale-[1.02]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10 
                         disabled:hover:scale-100"
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
                    ? 'bg-blue-500/20 text-white border border-blue-300/30 scale-[1.02]'
                    : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
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
              <div className="text-center p-8 text-xl font-semibold text-white/80">
                No {activeTab} challenges found
              </div>
            ) : (
              filteredChallenges.map(challenge => {
                const isChallenger = challenge.challenger_id === parseInt(localStorage.getItem('userId'));
                const otherUser = isChallenger ? challenge.challenged.username : challenge.challenger.username;
                
                return (
                  <div key={challenge.id} 
                    className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm 
                              shadow-lg transform hover:scale-[1.01] transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-medium text-white">
                          {isChallenger ? `You challenged ${otherUser}` : `${otherUser} challenged you`}
                        </h3>
                        <p className="text-sm text-white/60">
                          {new Date(challenge.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm
                         ${challenge.status === 'pending' ? 'bg-yellow-500/10 border border-yellow-300/30 text-yellow-100' :
                           challenge.status === 'accepted' ? 'bg-blue-500/10 border border-blue-300/30 text-blue-100' :
                           challenge.status === 'in_progress' ? 'bg-purple-500/10 border border-purple-300/30 text-purple-100' :
                           'bg-green-500/10 border border-green-300/30 text-green-100'}`}
                        >
                          {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                        </span>
                        
                        {(activeTab === 'active' || activeTab === 'completed') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChallenge(challenge.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full
                                     bg-red-500/10 hover:bg-red-500/20 border border-red-300/30
                                     text-red-200 hover:text-red-100 transition-all duration-200"
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
                          className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300
                                   bg-green-500/10 hover:bg-green-500/20 backdrop-blur-sm 
                                   border border-green-300/30 text-white hover:shadow-lg 
                                   transform hover:scale-[1.02]"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => respondToChallenge(challenge.id, false)}
                          className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300
                                   bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm 
                                   border border-red-300/30 text-white hover:shadow-lg 
                                   transform hover:scale-[1.02]"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {challenge.status === 'accepted' && (
                      <button 
                        onClick={() => startChallenge(challenge.id)}
                        className="w-full mt-4 px-8 py-4 rounded-xl font-medium transition-all duration-300
                                 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                                 text-white hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        Start Challenge
                      </button>
                    )}
                    
                    {challenge.status === 'completed' && (
                      <div className="mt-4 space-y-3">
                        <div className="text-center p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                          {challenge.winner_id ? (
                            <span className={`font-medium ${
                              challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                              ? 'text-green-200' 
                              : 'text-red-200'
                            }`}>
                              {challenge.winner_id === parseInt(localStorage.getItem('userId')) 
                                ? '🏆 You won!' 
                                : '💔 You lost!'}
                            </span>
                          ) : (
                            <span className="font-medium text-yellow-200">🤝 It's a draw!</span>
                          )}
                        </div>
                        <button 
                          onClick={() => viewResults(challenge.id)}
                          className="w-full px-8 py-4 rounded-xl font-medium transition-all duration-300
                                   bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                                   text-white hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          View Results
                        </button>
                      </div>
                    )}
                    
                    {challenge.status === 'in_progress' && (
                      <button 
                        onClick={() => navigate(`/challenge-quiz/${challenge.id}`)}
                        className="w-full mt-4 px-8 py-4 rounded-xl font-medium transition-all duration-300
                                 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                                 text-white hover:shadow-lg transform hover:scale-[1.02]"
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
      </div>
    </div>
  );
}

export default Challenges;

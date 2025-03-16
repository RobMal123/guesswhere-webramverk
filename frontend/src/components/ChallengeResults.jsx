import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ChallengeResults() {
  /**
   * Component that displays the results of a challenge between two players.
   * Shows each player's scores per round and total score.
   * 
   * Uses URL parameter 'challengeId' to fetch the specific challenge results.
   * 
   * State:
   * - results: Contains challenge details and scores
   * - loading: Boolean indicating if data is being fetched
   * - error: Error message if fetch fails
   */

  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [challengeId]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/${challengeId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge results');
      }
      
      const data = await response.json();
      console.log('Results data:', data); // Debug log
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-white">
        Loading results...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-red-200">Error: {error}</div>
    </div>
  );

  if (!results) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-white">
        No results found
      </div>
    </div>
  );

  // Group scores by user
  const scoresByUser = results.scores.reduce((acc, score) => {
    /**
     * Reduces the array of scores into an object grouped by user.
     * Each user entry contains:
     * - username: The player's username
     * - totalScore: Sum of all scores for this player
     * - scores: Array of individual round scores
     */
    const userId = score.user_id;
    
    // Try to get username from score first, fall back to challenge object if needed
    const username = score.user?.username || (
      userId === results.challenge.challenger_id 
        ? results.challenge.challenger.username
        : results.challenge.challenged.username
    );
    
    if (!acc[userId]) {
      acc[userId] = {
        username,
        totalScore: 0,
        scores: []
      };
    }
    acc[userId].scores.push(score);
    acc[userId].totalScore += score.score;
    return acc;
  }, {});

  return (
    <div className="relative z-10">
      <div className="p-8 w-full max-w-7xl mx-auto">
        <div className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Challenge Results
          </h1>
          
          <div className="space-y-8">
            {/* Challenge Status */}
            <div className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Challenge Details
              </h2>
              <div className="grid gap-3 text-white/80">
                <p><span className="font-medium text-white">Status:</span> {results.challenge.status}</p>
                <p><span className="font-medium text-white">Started:</span> {new Date(results.challenge.created_at).toLocaleString()}</p>
                {results.challenge.completed_at && (
                  <p><span className="font-medium text-white">Completed:</span> {new Date(results.challenge.completed_at).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Winner Banner - Only show if challenge is completed */}
            {results.challenge.status === 'completed' && (
              <div className="p-8 rounded-xl bg-blue-500/20 border border-blue-300/30 backdrop-blur-sm text-white shadow-lg text-center transform hover:scale-[1.02] transition-all duration-300">
                <h2 className="text-3xl font-bold">
                  {results.challenge.winner_id ? (
                    <>
                      🏆 Winner: {
                        Object.values(scoresByUser).find(
                          user => user.scores[0].user_id === results.challenge.winner_id
                        )?.username
                      }
                    </>
                  ) : (
                    "🤝 It's a Draw!"
                  )}
                </h2>
              </div>
            )}

            {/* Player Scores */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">
                Player Scores
              </h2>
              {Object.values(scoresByUser).map((userData, index) => (
                <div 
                  key={index} 
                  className={`p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg
                    transform hover:scale-[1.01] transition-all duration-300
                    ${results.challenge.winner_id === userData.scores[0].user_id
                      ? 'border-blue-300/30 bg-blue-500/10'
                      : ''
                    }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-medium text-white">{userData.username}</h3>
                      {results.challenge.winner_id === userData.scores[0].user_id && (
                        <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-300/30 text-white text-sm font-medium">
                          Winner 🏆
                        </span>
                      )}
                    </div>
                    <span className="text-3xl font-bold text-white">
                      {userData.totalScore} points
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {userData.scores
                      .sort((a, b) => a.round_number - b.round_number)
                      .map((score, scoreIndex) => (
                        <div key={scoreIndex} className="flex justify-between items-center text-white/80">
                          <span>Round {score.round_number}</span>
                          <span>{score.score} points ({score.distance.toFixed(1)} km)</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Back button */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/challenges')}
                className="px-8 py-4 rounded-xl font-medium transition-all duration-300
                          bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20
                          text-white hover:shadow-lg transform hover:scale-[1.02]"
              >
                Back to Challenges
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeResults;

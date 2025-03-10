import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ChallengeResults() {
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

  if (loading) return <div className="text-center p-8">Loading results...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  if (!results) return <div className="text-center p-8">No results found</div>;

  // Group scores by user
  const scoresByUser = results.scores.reduce((acc, score) => {
    const userId = score.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        username: score.user?.username || 'Unknown User',
        totalScore: 0,
        scores: []
      };
    }
    acc[userId].scores.push(score);
    acc[userId].totalScore += score.score;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Challenge Results</h1>
      
      <div className="space-y-8">
        {/* Challenge Status */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Challenge Details</h2>
          <div className="grid gap-2">
            <p><span className="font-medium">Status:</span> {results.challenge.status}</p>
            <p><span className="font-medium">Started:</span> {new Date(results.challenge.created_at).toLocaleString()}</p>
            {results.challenge.completed_at && (
              <p><span className="font-medium">Completed:</span> {new Date(results.challenge.completed_at).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Player Scores */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Player Scores</h2>
          {Object.values(scoresByUser).map((userData, index) => (
            <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{userData.username}</h3>
                <span className="text-2xl font-bold text-blue-600">
                  {userData.totalScore} points
                </span>
              </div>
              
              <div className="space-y-3">
                {userData.scores.map((score, scoreIndex) => (
                  <div key={scoreIndex} className="flex justify-between items-center text-sm text-gray-600">
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeResults;

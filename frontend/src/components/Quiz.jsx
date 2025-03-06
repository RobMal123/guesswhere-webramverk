import React, { useState, useEffect } from 'react';
import Map from './Map';
import AchievementNotification from './AchievementNotification';

function Quiz({ category, onGameComplete }) {
  const [currentImage, setCurrentImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [distance, setDistance] = useState(null);
  const [correctLocation, setCorrectLocation] = useState(null);
  const [guessedLocation, setGuessedLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationId, setLocationId] = useState(null);
  const [usedLocationIds, setUsedLocationIds] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const TOTAL_ROUNDS = 5;
  const [locationName, setLocationName] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  useEffect(() => {
    startGameSession();
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to play');
      return;
    }
    fetchLocation();
  }, []);

  const startGameSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/game-sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setGameSessionId(data.id);
    } catch (error) {
      setError('Failed to start game session');
    }
  };

  const endGameSession = async () => {
    if (!gameSessionId) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/game-sessions/${gameSessionId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Failed to end game session:', error);
    }
  };

  const handleGameComplete = async (totalScore) => {
    await endGameSession();
    onGameComplete(totalScore);
  };

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      const baseUrl = category === 'Random' 
        ? 'http://localhost:8000/locations/random'
        : `http://localhost:8000/locations/category/${category}`;
      
      const excludeParam = usedLocationIds.length > 0 
        ? `?exclude=${usedLocationIds.join(',')}`
        : '';
      
      const url = `${baseUrl}${excludeParam}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      const data = await response.json();
      
      console.log('Location data:', data);
      setUsedLocationIds(prev => [...prev, data.id]);
      setCurrentImage(data.image_url);
      setCorrectLocation([data.latitude, data.longitude]);
      setLocationId(data.id);
      setLocationName(data.name || 'this location');
      setShowResult(false);
      setGuessedLocation(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuessSubmit = async (position) => {
    setGuessedLocation([position.lat, position.lng]);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/submit-guess', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          guessed_latitude: position.lat,
          guessed_longitude: position.lng,
          actual_latitude: correctLocation[0],
          actual_longitude: correctLocation[1],
          location_id: locationId,
          game_session_id: gameSessionId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      setScore(data.score);
      setTotalScore(prevTotal => prevTotal + data.score);
      setDistance(data.distance);
      setShowResult(true);

      // Fetch new achievements after submitting guess
      const achievementsResponse = await fetch('http://localhost:8000/users/achievements/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        // Compare with previous achievements to find new ones
        const newOnes = achievementsData.filter(achievement => 
          !newAchievements.some(existing => 
            existing.achievement_id === achievement.achievement_id
          )
        );
        
        if (newOnes.length > 0) {
          setNewAchievements(achievementsData);
          // Show achievements one by one
          newOnes.forEach((achievement, index) => {
            setTimeout(() => {
              setCurrentAchievement(achievement);
              setShowAchievement(true);
            }, index * 3000); // Show each achievement for 3 seconds
          });
        }
      }

    } catch (error) {
      console.error('Detailed error:', error);
      setError(error.message);
    }
  };

  const handleCloseAchievement = () => {
    setShowAchievement(false);
    setCurrentAchievement(null);
  };

  const handleNextRound = () => {
    if (roundNumber >= TOTAL_ROUNDS) {
      // Game complete
      handleGameComplete(totalScore);
    } else {
      setRoundNumber(prev => prev + 1);
      fetchLocation();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="quiz-container">
      <div className="game-info p-4">
        <div className="text-lg font-bold">Round {roundNumber} of {TOTAL_ROUNDS}</div>
        <div>Total Score: {totalScore}</div>
      </div>

      {currentImage && (
        <div className="image-container">
          <img 
            src={`http://localhost:8000/${currentImage}`} 
            alt="Guess this location" 
            className="location-image"
            onError={(e) => {
              console.error('Image failed to load:', e.target.src);
              setError('Failed to load image');
            }}
          />
        </div>
      )}
      
      <Map
        onGuessSubmit={handleGuessSubmit}
        showResult={showResult}
        correctLocation={correctLocation}
        guessedLocation={guessedLocation}
        locationId={locationId}
      />
      
      {showResult && (
        <div className="result-container">
          <h2>Round Score: {score} points</h2>
          <p>You were {distance} km away from {locationName}!</p>
          <button 
            onClick={handleNextRound}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {roundNumber >= TOTAL_ROUNDS ? 'Finish Game' : 'Next Location'}
          </button>
        </div>
      )}

      {showAchievement && currentAchievement && (
        <AchievementNotification 
          achievement={currentAchievement.achievement}
          onClose={handleCloseAchievement}
        />
      )}
    </div>
  );
}

export default Quiz;

import React, { useState, useEffect } from 'react';
import Map from './Map';

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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to play');
      return;
    }
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      // Add all used location IDs to the exclude parameter
      const excludeParam = usedLocationIds.length > 0 
        ? `&exclude=${usedLocationIds.join(',')}`
        : '';
      
      const baseUrl = category === 'random' 
        ? 'http://localhost:8000/locations/random'
        : `http://localhost:8000/locations/random?category=${category}`;
      
      const url = `${baseUrl}${excludeParam}`;
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      const data = await response.json();
      
      // Add the new location ID to the used locations array
      setUsedLocationIds(prev => [...prev, data.id]);
      setCurrentImage(data.image_url);
      setCorrectLocation([data.latitude, data.longitude]);
      setLocationId(data.id);
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
          location_id: locationId
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
    } catch (error) {
      console.error('Detailed error:', error);
      setError(error.message);
    }
  };

  const handleNextRound = () => {
    if (roundNumber >= TOTAL_ROUNDS) {
      // Game complete
      onGameComplete(totalScore);
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
          <p>You were {distance} km away from the target!</p>
          <button 
            onClick={handleNextRound}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {roundNumber >= TOTAL_ROUNDS ? 'Finish Game' : 'Next Location'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;

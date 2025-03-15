import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map from './Map';

function ChallengeQuiz() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [guessedLocation, setGuessedLocation] = useState(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    fetchChallengeDetails();
    return () => clearInterval(timerIntervalRef.current);
  }, [challengeId]);

  useEffect(() => {
    if (locations.length > 0 && currentRound <= locations.length) {
      // Sort locations by order_index
      const sortedLocations = [...locations].sort((a, b) => a.order_index - b.order_index);
      
      // If current round is greater than total locations, navigate to results
      if (currentRound > sortedLocations.length) {
        console.log('Current player completed all rounds, navigating to results');
        navigate(`/challenge-results/${challengeId}`);
        return;
      }

      const currentLoc = sortedLocations.find(loc => loc.order_index === currentRound);
      
      if (currentLoc) {
        setCurrentLocation(currentLoc.location);
        setTimeElapsed(0);
        setTimerStarted(false);
        setShowResult(false);
        setGuessedLocation(null);
        setShowMap(false);
        setMapKey(prev => prev + 1);
      }
    }
  }, [locations, currentRound]);

  // Start the timer when the map is first viewed
  useEffect(() => {
    if (showMap && !timerStarted) {
      setTimerStarted(true);
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
  }, [showMap, timerStarted]);

  const fetchChallengeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/${challengeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge details');
      }
      
      const data = await response.json();
      console.log('Challenge details:', data);
      
      if (!data.locations || !Array.isArray(data.locations) || data.locations.length === 0) {
        throw new Error('No locations found for this challenge');
      }

      // Sort locations by order_index
      const sortedLocations = [...data.locations].sort((a, b) => a.order_index - b.order_index);
      
      // If current round is greater than total locations, navigate to results
      if (data.current_round > sortedLocations.length) {
        console.log('Current player completed all rounds, navigating to results');
        navigate(`/challenge-results/${challengeId}`);
        return;
      }

      setChallenge(data);
      setLocations(sortedLocations);
      setCurrentRound(data.current_round);
      
      // Find the current location based on the round
      const currentLoc = sortedLocations.find(loc => loc.order_index === data.current_round);
      
      if (!currentLoc) {
        console.error('Available locations:', sortedLocations.map(loc => loc.order_index));
        throw new Error(`No location found for round ${data.current_round}`);
      }

      setCurrentLocation(currentLoc.location);
      setShowMap(false);
      setMapKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessSubmit = async (position) => {
    clearInterval(timerIntervalRef.current);
    setGuessedLocation([position.lat, position.lng]);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/challenges/${challengeId}/submit-guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_id: currentLocation.id,
          guessed_latitude: position.lat,
          guessed_longitude: position.lng,
          actual_latitude: currentLocation.latitude,
          actual_longitude: currentLocation.longitude,
          time_taken: timeElapsed,
          round_number: currentRound
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit guess');
      }

      const data = await response.json();
      setScore(data.score);
      setDistance(data.distance);
      setShowResult(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleNextRound = async () => {
    await fetchChallengeDetails();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Loading challenge...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-red-600">Error: {error}</div>
    </div>
  );

  if (!currentLocation) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Loading location...
      </div>
    </div>
  );

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Round {currentRound} of {locations.length}
        </h2>
        <div className="flex items-center gap-6">
          <div className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Score: {score}
          </div>
          <div className={`text-xl font-semibold ${timeElapsed > 45 ? 'text-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
            Time: {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 transform
            ${!showMap 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-blue-500/30 scale-[1.02]' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:scale-[1.02]'}`}
        >
          View Image
        </button>
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 transform
            ${showMap 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-blue-500/30 scale-[1.02]' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:scale-[1.02]'}`}
        >
          View Map
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-gray-800 to-gray-900">
        {currentLocation && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${showMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <img 
              src={`http://localhost:8000/images/${currentLocation.image_url.replace('images/', '')}`} 
              alt="Guess this location" 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                setError('Failed to load image');
              }}
            />
          </div>
        )}
        
        <div className={`absolute inset-0 transition-opacity duration-300 ${!showMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Map
            key={mapKey}
            onGuessSubmit={handleGuessSubmit}
            showResult={showResult}
            correctLocation={[currentLocation.latitude, currentLocation.longitude]}
            guessedLocation={guessedLocation}
            locationId={currentLocation.id}
          />
        </div>
      </div>
      
      {/* Results Section */}
      {showResult && (
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-xl">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">
              Round Score: {score} points
            </h2>
            <p className="text-gray-300 text-lg">
              You were {Math.round(distance)} km away from {currentLocation.name || 'this location'}!
            </p>
            <p className="text-gray-300 text-lg">
              Time taken: {formatTime(timeElapsed)}
            </p>
            <button 
              onClick={handleNextRound}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 
                       text-white rounded-xl shadow-lg hover:shadow-blue-500/30 
                       transform hover:scale-[1.02] transition-all duration-300
                       max-w-xs mx-auto"
            >
              {currentRound >= locations.length ? 'See Results' : 'Next Location'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeQuiz;

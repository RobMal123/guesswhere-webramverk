import React, { useState, useEffect } from 'react';
import Map from './Map';
import AchievementNotification from './AchievementNotification';
import { useNavigate } from 'react-router-dom';

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
  const [showMap, setShowMap] = useState(false);
  const [imageViewMode, setImageViewMode] = useState('cover');
  const navigate = useNavigate();

  useEffect(() => {
    // Reset game state when category changes
    setUsedLocationIds([]);
    setRoundNumber(1);
    setTotalScore(0);
    startNewGame();
  }, [category]);

  const startNewGame = async () => {
    try {
      // Start new game session
      await startGameSession();
      // Fetch first location
      await fetchLocation();
    } catch (error) {
      setError('Failed to start new game');
    }
  };

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
      // Reset used locations when starting new session
      setUsedLocationIds([]);
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

    // Check for new achievements after game completion
    try {
      const token = localStorage.getItem('token');
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
          // Sort by points required (descending) and take the highest one
          const highestAchievement = newOnes.reduce((highest, current) => 
            (current.achievement.points_required > highest.achievement.points_required) 
              ? current 
              : highest
          );
          
          setCurrentAchievement(highestAchievement);
          setShowAchievement(true);
          setNewAchievements(achievementsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }

    onGameComplete(totalScore);
  };

  const fetchLocation = async () => {
    try {
      setIsLoading(true);
      const baseUrl = category === 'Random' 
        ? 'http://localhost:8000/locations/random'
        : `http://localhost:8000/locations/category/${category}`;
      
      // Only include exclude parameter if we have used locations in current session
      const excludeParam = usedLocationIds.length > 0 
        ? `?exclude=${usedLocationIds.join(',')}`
        : '';
      
      const url = `${baseUrl}${excludeParam}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Unfortunately, there are no more locations available for ${category} category.`);
        }
        throw new Error('Unfortunately, there are no more locations available for this category.');
      }
      
      // console.log('Location data:', data); // Removed logging
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
    } catch (error) {
      console.error('Detailed error:', error);
      setError(error.message);
    }
  };

  const handleCloseAchievement = () => {
    setShowAchievement(false);
    setCurrentAchievement(null);
  };

  const handleViewAllAchievements = () => {
    // Close the current notification
    handleCloseAchievement();
    // Navigate to achievements page (you can adjust this based on your routing setup)
    window.location.href = '/achievements';
  };

  const handleNextRound = () => {
    // Reset to image view
    setShowMap(false);
    
    if (roundNumber >= TOTAL_ROUNDS) {
      // Game complete
      handleGameComplete(totalScore);
    } else {
      setRoundNumber(prev => prev + 1);
      fetchLocation();
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-2xl font-semibold text-white">
        Loading...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="p-6 text-xl font-semibold text-center text-white border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20">
        {error}
      </div>
      <button 
        onClick={() => navigate('/')}
        className="px-8 py-3 text-white transition-all duration-300 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:shadow-lg transform hover:scale-[1.02]"
      >
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="relative z-10 w-full p-8 mx-auto max-w-7xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">
          Round {roundNumber} of {TOTAL_ROUNDS}
        </h2>
        <div className="text-xl font-semibold text-white">
          Total Score: {totalScore}
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 transform
            ${!showMap 
              ? 'bg-white/20 text-white shadow-lg scale-[1.02] backdrop-blur-sm border border-white/20' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm border border-white/10'}`}
        >
          View Image
        </button>
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 transform
            ${showMap 
              ? 'bg-white/20 text-white shadow-lg scale-[1.02] backdrop-blur-sm border border-white/20' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm border border-white/10'}`}
        >
          View Map
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-xl 
                    backdrop-blur-sm bg-white/10 border border-white/20">
        {currentImage && (
          <div className={`absolute inset-0 transition-opacity duration-300 
                        ${showMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <img 
              src={`http://localhost:8000/${currentImage}`} 
              alt="Guess this location" 
              className={`w-full h-full ${imageViewMode === 'cover' ? 'object-cover' : 'object-contain'}`}
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                setError('Failed to load image');
              }}
            />
            {/* Image View Mode Toggle Button */}
            {!showMap && (
              <button
                onClick={() => setImageViewMode(prev => prev === 'cover' ? 'contain' : 'cover')}
                className="absolute flex items-center justify-center w-8 h-8 transition-all duration-200 border rounded-lg bottom-4 right-4 bg-black/20 hover:bg-black/40 text-white/90 backdrop-blur-sm border-white/20"
                title={imageViewMode === 'cover' ? 'Show full image' : 'Fill frame'}
              >
                <span className="text-base drop-shadow-lg">
                  {imageViewMode === 'cover' ? '🔍' : '🖼️'}
                </span>
              </button>
            )}
          </div>
        )}
        
        <div className={`absolute inset-0 transition-opacity duration-300 
                      ${!showMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Map
            onGuessSubmit={handleGuessSubmit}
            showResult={showResult}
            correctLocation={correctLocation}
            guessedLocation={guessedLocation}
            locationId={locationId}
          />
        </div>
      </div>
      
      {/* Results Section */}
      {showResult && (
        <div className="p-6 mt-8 text-white border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">
              Round Score: {score} points
            </h2>
            <p className="text-lg text-white/80">
              You were {Math.round(distance)} km away from {locationName}!
            </p>
            <button 
              onClick={handleNextRound}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 
                       text-white rounded-xl shadow-lg
                       transform hover:scale-[1.02] transition-all duration-300
                       backdrop-blur-sm border border-white/20
                       max-w-xs mx-auto"
            >
              {roundNumber >= TOTAL_ROUNDS ? 'Finish Game' : 'Next Location'}
            </button>
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      {showAchievement && currentAchievement && (
        <AchievementNotification 
          achievement={currentAchievement.achievement}
          totalNewAchievements={newAchievements.length}
          onClose={handleCloseAchievement}
          onViewAll={handleViewAllAchievements}
        />
      )}
    </div>
  );
}

export default Quiz;

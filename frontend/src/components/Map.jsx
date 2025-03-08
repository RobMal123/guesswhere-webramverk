import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onGuessSubmit, correctLocation, locationId }) {
  useMapEvents({
    click: async (e) => {
      try {
        console.log('Submitting guess with data:', {
          guessed_latitude: e.latlng.lat,
          guessed_longitude: e.latlng.lng,
          actual_latitude: correctLocation.lat,
          actual_longitude: correctLocation.lng,
          location_id: locationId
        });

        const response = await fetch('http://localhost:8000/submit-guess', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            guessed_latitude: e.latlng.lat,
            guessed_longitude: e.latlng.lng,
            actual_latitude: correctLocation.lat,
            actual_longitude: correctLocation.lng,
            location_id: locationId
          })
        });

        onGuessSubmit(e.latlng);
      } catch (error) {
        console.error('Detailed error:', error);
        alert(`Error submitting guess: ${error.message}`);
      }
    },
  });
  return null;
}

function Map({ onGuessSubmit, showResult, correctLocation, guessedLocation, locationId }) {
  // Convert array format to object format if needed
  const formattedLocation = Array.isArray(correctLocation) ? {
    lat: correctLocation[0],
    lng: correctLocation[1]
  } : correctLocation;

  // Add debug logging
  console.log('Map props:', {
    correctLocation,
    formattedLocation,
    locationId,
    showResult
  });

  // Validate props
  if (!formattedLocation?.lat || !formattedLocation?.lng || !locationId) {
    console.error('Missing required props:', { correctLocation: formattedLocation, locationId });
    return <div className="text-red-600 p-4">Missing required location data</div>;
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {!showResult && (
          <MapClickHandler 
            onGuessSubmit={onGuessSubmit}
            correctLocation={formattedLocation}
            locationId={locationId}
          />
        )}
        
        {showResult && formattedLocation && (
          <Marker 
            position={formattedLocation}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
        
        {showResult && guessedLocation && (
          <Marker 
            position={guessedLocation}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default Map;

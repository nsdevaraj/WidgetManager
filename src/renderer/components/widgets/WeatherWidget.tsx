import React from 'react';

export const WeatherWidget: React.FC = () => {
  // TODO: Integrate with actual weather API
  return (
    <div className="weather-preview">
      <span>🌤️</span>
      <span>72°F</span>
      <span>Sunny</span>
    </div>
  );
}; 
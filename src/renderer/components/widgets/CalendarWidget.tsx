import React from 'react';

export const CalendarWidget: React.FC = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  return (
    <div className="calendar-preview">
      <div className="calendar-header">
        {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }, (_, i) => (
          <div key={i} className={`calendar-day ${i + 1 === today.getDate() ? 'today' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}; 
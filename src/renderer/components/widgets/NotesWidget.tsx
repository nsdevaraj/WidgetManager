import React, { useState } from 'react';

export const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState('');

  return (
    <div className="notes-preview">
      <div className="note-header">Quick Notes</div>
      <textarea
        className="note-content"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Type your notes here..."
      />
    </div>
  );
}; 
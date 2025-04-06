import React from 'react';
import WindowChrome from './components/WindowChrome';
import WidgetContainer from './components/WidgetContainer';
import './index.css';

const App: React.FC = () => {
  return (
    <>
      <WindowChrome />
      <div className="app">
        <h1>Widget Desktop</h1>
        <p>
          Welcome to Widget Desktop - Your customizable desktop widget manager.
          Add, arrange, and customize widgets to enhance your desktop experience.
        </p>
        <button className="button" onClick={() => console.log('Add widget clicked')}>
          Add Widget
        </button>
      </div>
      <WidgetContainer />
    </>
  );
};

export default App; 
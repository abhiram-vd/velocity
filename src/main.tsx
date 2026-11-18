import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/share-tech-mono/latin-400.css';
import App from './ui/App';
import './ui/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

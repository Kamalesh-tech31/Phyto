import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initModelWarmup } from './services/modelService';

createRoot(document.getElementById('root')!).render(<App />);

// Pre-load and warm up the TF.js model during idle time after first online load
initModelWarmup();

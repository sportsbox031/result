import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './hooks/useToast';
import { FirebaseDataProvider } from './hooks/useFirebaseData';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <FirebaseDataProvider>
        <App />
      </FirebaseDataProvider>
    </ToastProvider>
  </StrictMode>
);

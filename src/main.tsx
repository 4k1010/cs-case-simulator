import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

import { GoogleOAuthProvider } from '@react-oauth/google';

// Client ID
const GOOGLE_CLIENT_ID = "706228996298-dg3cc4h4n22fa6cepsml9ma1bjdljhja.apps.googleusercontent.com"; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. 用 Provider 包住 App */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
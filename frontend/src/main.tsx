import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './assets/styles/global.css'
import './assets/styles/animations.css'
import './assets/styles/components.css'
import './assets/styles/accessibility.css'
import 'react-markdown-editor-lite/lib/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

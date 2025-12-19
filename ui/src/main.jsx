// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 OurITRes

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { UnifiedDataProvider } from './context/UnifiedDataContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UnifiedDataProvider>
      <App />
    </UnifiedDataProvider>
  </StrictMode>,
)

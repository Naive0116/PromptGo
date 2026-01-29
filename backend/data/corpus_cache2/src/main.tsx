import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LangProvider } from './i18n' // Import LangProvider
import './styles/global.css' // Import global.css instead of index.css

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider> {/* Wrap with LangProvider */}
      <RouterProvider router={router} />
    </LangProvider>
  </React.StrictMode>,
)
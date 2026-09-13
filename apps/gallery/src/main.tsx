import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { presetStylesheet, storedThemeId } from './theme'

import './ui-styles.css'
import './styles.css'

// Themes go in before the first paint, so a stored theme never flashes the default.
const themes = document.createElement('style')
themes.dataset.gallery = 'themes'
themes.textContent = presetStylesheet()
document.head.append(themes)
document.documentElement.dataset.theme = storedThemeId()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

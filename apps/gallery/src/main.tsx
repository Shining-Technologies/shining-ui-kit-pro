import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

import '@shining-technologies/ui-kit-react/styles.css'
import '@shining-technologies/ui-kit-examples/examples.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/wordle-pvp">
      <App />
    </BrowserRouter>
  </StrictMode>
)

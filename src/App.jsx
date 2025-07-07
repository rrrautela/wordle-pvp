import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SinglePlayer from './pages/SinglePlayer';
import MultiPlayer from './pages/MultiPlayer';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/single" element={<SinglePlayer />} />
      <Route path="/multi" element={<MultiPlayer />} />
    </Routes>
  );
}

export default App;

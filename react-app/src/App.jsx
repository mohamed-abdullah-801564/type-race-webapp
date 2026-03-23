import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SoloMode from './pages/SoloMode';
import Multiplayer from './pages/Multiplayer';

function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solo" element={<SoloMode />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

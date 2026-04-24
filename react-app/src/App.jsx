import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SoloMode from './pages/SoloMode';
import Multiplayer from './pages/Multiplayer';
import GhostVault from './pages/GhostVault';
import TrainingAcademy from './pages/TrainingAcademy';

function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solo" element={<SoloMode />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/vault" element={<GhostVault />} />
          <Route path="/academy" element={<TrainingAcademy />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

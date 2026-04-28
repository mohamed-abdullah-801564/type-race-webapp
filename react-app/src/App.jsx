import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SoloMode from './pages/SoloMode';
import Multiplayer from './pages/Multiplayer';
import GhostVault from './pages/GhostVault';
import TrainingAcademy from './pages/TrainingAcademy';
import DailyChallenge from './pages/DailyChallenge';
import Achievements from './pages/Achievements';
import KeyPractice from './pages/KeyPractice';

import RouteGuard from './components/RouteGuard';

function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solo" element={<SoloMode />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/vault" element={<RouteGuard><GhostVault /></RouteGuard>} />
          <Route path="/academy" element={<RouteGuard><TrainingAcademy /></RouteGuard>} />
          <Route path="/daily" element={<DailyChallenge />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/practice" element={<KeyPractice />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

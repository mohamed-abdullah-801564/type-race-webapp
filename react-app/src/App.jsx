import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SoloMode from './pages/SoloMode';
import Multiplayer from './pages/Multiplayer';
import GhostVault from './pages/GhostVault';
import TrainingAcademy from './pages/TrainingAcademy';
import DailyChallenge from './pages/DailyChallenge';
import Achievements from './pages/Achievements';
import KeyPractice from './pages/KeyPractice';
import MonkeytypeCompare from './pages/compare/MonkeytypeCompare';
import TyperacerCompare from './pages/compare/TyperacerCompare';

import RouteGuard from './components/RouteGuard';

function App() {
  const [theme, setTheme] = React.useState('dark');

  React.useEffect(() => {
    window.toggleNeuralTheme = () => {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };
    return () => {
      delete window.toggleNeuralTheme;
    };
  }, []);

  return (
    <BrowserRouter>
      <div className={theme}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/solo" element={<SoloMode />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/vault" element={<RouteGuard><GhostVault /></RouteGuard>} />
          <Route path="/academy" element={<RouteGuard><TrainingAcademy /></RouteGuard>} />
          <Route path="/daily" element={<DailyChallenge />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/practice" element={<KeyPractice />} />
          <Route path="/compare/monkeytype-alternative" element={<MonkeytypeCompare />} />
          <Route path="/compare/typeracer-alternative" element={<TyperacerCompare />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

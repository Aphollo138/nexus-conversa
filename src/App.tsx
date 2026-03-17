/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import Sobre from './pages/Sobre';
import Dicas from './pages/Dicas';
import InstallPrompt from './components/InstallPrompt';
import { NotificationProvider } from './contexts/NotificationContext';

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/dicas" element={<Dicas />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}


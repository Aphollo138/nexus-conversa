/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Adicionado para escutar o login

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
import { useNativePush } from './hooks/useNativePush'; // Seu hook nativo

export default function App() {
  const { initPushNotifications } = useNativePush();

  useEffect(() => {
    // Pegamos a instância do Firebase Auth
    const auth = getAuth();
    
    // O onAuthStateChanged fica "vigiando" o status do usuário em tempo real
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuário logado detectado! Iniciando Push Notifications nativas...");
        // Passa o ID do usuário para o hook salvar o token do aparelho no banco
        initPushNotifications(user.uid);
      }
    });

    // Limpeza de segurança para não duplicar o listener
    return () => unsubscribe();
  }, [initPushNotifications]);

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
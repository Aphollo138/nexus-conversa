import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getDatabase, ref, update } from 'firebase/database'; // Importe seu banco de dados!

export const useNativePush = () => {

  // 1. Criamos a função recebendo o userId do App.tsx
  const initPushNotifications = async (userId: string) => {
    
    // Verifica se está rodando no celular nativo (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push nativo ignorado: rodando na Web.');
      return;
    }

    try {
      // 2. Solicita permissão ao usuário (Obrigatório no Android 13+)
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Permissão de Push negada pelo usuário.');
        return;
      }

      // 3. Registra o dispositivo no Firebase
      await PushNotifications.register();

      // Limpa ouvintes antigos para evitar duplicação
      await PushNotifications.removeAllListeners();

      // 4. Captura o Token e SALVA NO BANCO
      await PushNotifications.addListener('registration', (token) => {
        console.log('FCM Token recebido:', token.value);
        
        // Salvando o token no perfil do usuário no Realtime Database
        const db = getDatabase();
        const userRef = ref(db, `users/${userId}`);
        update(userRef, {
          fcmToken: token.value
        }).catch((err) => console.error("Erro ao salvar token no banco:", err));
      });

      await PushNotifications.addListener('registrationError', (err) => {
        console.error('Erro ao registrar push:', err.error);
      });

      // Escuta notificações que chegam com o app ABERTO (Foreground)
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificação recebida em foreground:', notification);
      });

      // Escuta quando o usuário CLICA na notificação (Background/Killed)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Usuário clicou na notificação:', action.notification);
      });

    } catch (error) {
      console.error('Erro ao inicializar Push:', error);
    }
  };

  // 5. O SEGREDO: Retornamos a função para o App.tsx poder usar!
  return { initPushNotifications };
};
import { useEffect, useRef, useState } from 'react';

const ORIGINAL_FAVICON_URL = 'https://i.postimg.cc/vZq064FL/Chat-GPT-Image-14-de-mar-de-2026-10-15-19-removebg-preview.png';

export function useDiscordTabNotification(unreadCount: number) {
  const originalTitle = useRef(document.title);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTabHidden, setIsTabHidden] = useState(document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
      if (!document.hidden) {
        // Limpar notificações quando a aba ficar visível
        clearNotification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const clearNotification = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    document.title = originalTitle.current;
    updateFavicon(ORIGINAL_FAVICON_URL);
  };

  const updateFavicon = (url: string) => {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  };

  const generateBadgeFavicon = (count: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = ORIGINAL_FAVICON_URL;
    img.onload = () => {
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(img, 0, 0, 32, 32);

      // Desenhar a bolinha vermelha (badge)
      ctx.beginPath();
      ctx.arc(24, 8, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#F23F42'; // Vermelho estilo Discord
      ctx.fill();

      // Desenhar o número
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayCount = count > 9 ? '9+' : count.toString();
      ctx.fillText(displayCount, 24, 8);

      updateFavicon(canvas.toDataURL('image/png'));
    };
  };

  useEffect(() => {
    if (unreadCount > 0 && isTabHidden) {
      generateBadgeFavicon(unreadCount);
      
      if (!intervalRef.current) {
        let showNewMessage = true;
        intervalRef.current = setInterval(() => {
          document.title = showNewMessage 
            ? `(${unreadCount}) Nova Mensagem!` 
            : originalTitle.current;
          showNewMessage = !showNewMessage;
        }, 1000);
      }
    } else if (unreadCount === 0) {
      clearNotification();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [unreadCount, isTabHidden]);
}

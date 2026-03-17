import { useEffect, useRef } from 'react';

interface UseDocumentTitleNotifyProps {
  unreadCount: number;
  originalTitle?: string;
  faviconUrl?: string;
}

export const useDocumentTitleNotify = ({
  unreadCount,
  originalTitle = 'Papos',
  faviconUrl = 'https://i.postimg.cc/vZq064FL/Chat_GPT_Image_14_de_mar_de_2026_10_15_19_removebg_preview.png'
}: UseDocumentTitleNotifyProps) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateFavicon = (count: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = faviconUrl;
      
      img.onload = () => {
        // Draw white circle background
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw the original image
        ctx.drawImage(img, 4, 4, 56, 56);

        // Draw notification badge if there are unread messages
        if (count > 0) {
          // Red circle
          ctx.beginPath();
          ctx.arc(50, 14, 14, 0, 2 * Math.PI);
          ctx.fillStyle = '#ef4444'; // Tailwind red-500
          ctx.fill();

          // Text
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const displayCount = count > 9 ? '9+' : count.toString();
          ctx.fillText(displayCount, 50, 15);
        }

        // Update favicon
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'icon';
        link.href = canvas.toDataURL('image/png');
        document.getElementsByTagName('head')[0].appendChild(link);
      };
    };

    if (unreadCount > 0) {
      let isShowingNotification = true;
      
      // Alternate title
      intervalRef.current = window.setInterval(() => {
        document.title = isShowingNotification ? `(${unreadCount}) Novas Mensagens!` : originalTitle;
        isShowingNotification = !isShowingNotification;
      }, 1000);

      updateFavicon(unreadCount);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.title = originalTitle;
      updateFavicon(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.title = originalTitle;
    };
  }, [unreadCount, originalTitle, faviconUrl]);
};

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url) {
  const socketRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const s = io(url, { withCredentials: true });
    socketRef.current = s;
    s.on('announcement', (payload) => setAnnouncements((a) => [payload, ...a].slice(0, 20)));
    return () => { s.close(); };
  }, [url]);

  const announce = (message) => socketRef.current?.emit('announce', message);
  return { announcements, announce };
}

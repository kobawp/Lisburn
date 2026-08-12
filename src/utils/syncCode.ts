export const generateSyncCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const getRand = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `LISB-${getRand(4)}-${getRand(4)}`;
};

export const getStoredSyncCode = (): string => {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('lisburn_sync_code');
  if (stored) return stored;
  
  const newCode = generateSyncCode();
  localStorage.setItem('lisburn_sync_code', newCode);
  return newCode;
};

export const setStoredSyncCode = (code: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lisburn_sync_code', code.toUpperCase().trim());
};

// client-safe helpers
export const saveToken = (t: string) => localStorage.setItem('token', t);
export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

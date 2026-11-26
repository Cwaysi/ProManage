import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';

const UserContext = createContext({ user: null, loading: true, logout: () => {} });

// eslint-disable-next-line
export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await api.get('/api/me/');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    window.location.href = '/login';
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refetch, logout }}>
      {children}
    </UserContext.Provider>
  );
}
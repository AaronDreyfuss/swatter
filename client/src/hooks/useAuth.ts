import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Single access point for auth state - components must not import AuthContext directly
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

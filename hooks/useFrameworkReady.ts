// hooks/useFrameworkReady.ts
import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    console.log('Framework is ready');
  }, []);
}
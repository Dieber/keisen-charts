import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type Framework,
  persistFramework,
  resolveInitialFramework,
} from '../lib/frameworkPreference';

type FrameworkContextValue = {
  framework: Framework;
  setFramework: (fw: Framework) => void;
};

const FrameworkContext = createContext<FrameworkContextValue | null>(null);

export function FrameworkProvider({children}: {children: ReactNode}) {
  const [framework, setFrameworkState] = useState<Framework>(() =>
    typeof window === 'undefined' ? 'react' : resolveInitialFramework(),
  );

  const setFramework = useCallback((fw: Framework) => {
    setFrameworkState(fw);
    persistFramework(fw);
  }, []);

  useEffect(() => {
    setFrameworkState(resolveInitialFramework());
    const onPopState = () => {
      setFrameworkState(resolveInitialFramework());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo(
    () => ({framework, setFramework}),
    [framework, setFramework],
  );

  return (
    <FrameworkContext.Provider value={value}>
      {children}
    </FrameworkContext.Provider>
  );
}

export function useFramework() {
  const ctx = useContext(FrameworkContext);
  if (!ctx) {
    throw new Error('useFramework must be used within FrameworkProvider');
  }
  return ctx;
}

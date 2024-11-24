// context/ReloadContext.tsx
import React, { createContext, useContext, useState } from "react";

interface ReloadContextProps {
  reloadKey: number;
  reloadApp: () => void;
}

const ReloadContext = createContext<ReloadContextProps>({
  reloadKey: 0,
  reloadApp: () => null,
});

interface ReloadProviderProps {
  children: React.ReactNode;
}

export function ReloadProvider({ children }: ReloadProviderProps) {
  const [reloadKey, setReloadKey] = useState(0);

  const reloadApp = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <ReloadContext.Provider value={{ reloadKey, reloadApp }}>
      {children}
    </ReloadContext.Provider>
  );
}

export function useReload(): ReloadContextProps {
  const context = useContext(ReloadContext);
  if (!context) {
    throw new Error("useReload must be used within a ReloadProvider");
  }
  return context;
}

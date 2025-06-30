import React, { createContext, useContext, ReactNode } from "react";

const RtlContext = createContext(false);

export const useRtl = () => useContext(RtlContext);

interface RtlProviderProps {
  isRTL: boolean;
  children: ReactNode;
}

export const RtlProvider = ({ isRTL, children }: RtlProviderProps) => (
  <RtlContext.Provider value={isRTL}>{children}</RtlContext.Provider>
); 
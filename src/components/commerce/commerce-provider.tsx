"use client";

import { createContext, useContext, type ReactNode } from "react";

const CommerceContext = createContext({ ordersEnabled: false });

export function CommerceProvider({
  ordersEnabled,
  children,
}: {
  ordersEnabled: boolean;
  children: ReactNode;
}) {
  return (
    <CommerceContext.Provider value={{ ordersEnabled }}>
      {children}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  return useContext(CommerceContext);
}

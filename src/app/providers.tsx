import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { dispatchRuntimeEvent } from "../lib/runtime/event-dispatcher";
import { MockRuntimeClient } from "../lib/runtime/mock-runtime-client";
import type { RuntimeClient } from "../lib/runtime/types";

const RuntimeClientContext = createContext<RuntimeClient | undefined>(undefined);

type RuntimeProviderProps = {
  children: ReactNode;
};

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const client = useMemo(() => new MockRuntimeClient(), []);

  useEffect(() => {
    const unsubscribe = client.subscribe(dispatchRuntimeEvent);
    async function boot() {
      await client.startRuntime();
      await client.ready();
    }
    void boot();
    return unsubscribe;
  }, [client]);

  return <RuntimeClientContext.Provider value={client}>{children}</RuntimeClientContext.Provider>;
}

export function useRuntimeClient(): RuntimeClient | undefined {
  return useContext(RuntimeClientContext);
}

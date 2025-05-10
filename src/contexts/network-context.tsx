"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";

type Network = "devnet" | "mainnet" | "testnet";

type NetworkContextType = {
  currentNetwork: Network;
  switchNetwork: (network: Network) => void;
};

const NetworkContext = createContext<NetworkContextType>({
  currentNetwork: "testnet",
  switchNetwork: () => {},
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const { network, selectNetwork } = useSuiClientContext();
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    network as Network
  );

  useEffect(() => {
    setCurrentNetwork(network as Network);
  }, [network]);

  const switchNetwork = (newNetwork: Network) => {
    selectNetwork(newNetwork);
    setCurrentNetwork(newNetwork);
  };

  return (
    <NetworkContext.Provider value={{ currentNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);

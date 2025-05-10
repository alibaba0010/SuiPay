import { useSuiClientContext } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_SECURE_TOKEN_PACKAGE_ID,
  DEVNET_TOKEN_OBJECT_ID,
  MAINNET__TOKEN_OBJECT_ID,
  MAINNET_SECURE_TOKEN_PACKAGE_ID,
  TESTNET_SECURE_TOKEN_PACKAGE_ID,
  TESTNET_TOKEN_OBJECT_ID,
} from "./constant";
import { createNetworkConfig } from "@mysten/dapp-kit";

const NETWORK_CONFIG = {
  devnet: {
    secureTokenPackageId: DEVNET_SECURE_TOKEN_PACKAGE_ID,
    tokenObjectId: DEVNET_TOKEN_OBJECT_ID,
  },
  mainnet: {
    secureTokenPackageId: "0x0TODO", // Replace with mainnet package ID
    tokenObjectId: "0x0TODO", // Replace with mainnet token ID
  },
  testnet: {
    secureTokenPackageId: TESTNET_SECURE_TOKEN_PACKAGE_ID,
    tokenObjectId: TESTNET_TOKEN_OBJECT_ID,
  },
} as const;

type Network = keyof typeof NETWORK_CONFIG;

function useNetworkVariables() {
  const { network } = useSuiClientContext();
  return NETWORK_CONFIG[network as Network];
}

const { networkConfig, useNetworkVariable } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      secureTokenPackageId: DEVNET_SECURE_TOKEN_PACKAGE_ID,
      tokenObjectId: DEVNET_TOKEN_OBJECT_ID,
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      secureTokenPackageId: MAINNET_SECURE_TOKEN_PACKAGE_ID,
      tokenObjectId: MAINNET__TOKEN_OBJECT_ID,
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      secureTokenPackageId: TESTNET_SECURE_TOKEN_PACKAGE_ID,
      tokenObjectId: TESTNET_TOKEN_OBJECT_ID,
    },
  },
});

export { useNetworkVariable, networkConfig, useNetworkVariables };

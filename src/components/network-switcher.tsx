"use client";

import { useSuiClientContext } from "@mysten/dapp-kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useNetwork } from "@/contexts/network-context";

const NETWORKS = {
  devnet: "Devnet",
  mainnet: "Mainnet",
  testnet: "Testnet",
} as const;

type Network = keyof typeof NETWORKS;

// Network colors for visual indicators
const NETWORK_COLORS = {
  devnet: "bg-amber-500",
  mainnet: "bg-green-500",
  testnet: "bg-blue-500",
};

export function NetworkSwitcher() {
  const { network } = useSuiClientContext();
  const { switchNetwork } = useNetwork();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Select
        value={network}
        onValueChange={(value) => switchNetwork(value as Network)}
      >
        <SelectTrigger className="w-[180px] md:w-[200px] bg-[#061020] border-[#1a2a40] text-white hover:bg-[#0a1930] transition-colors rounded-md pl-3 pr-2 h-10 flex items-center gap-2 focus:ring-blue-600 focus:ring-offset-[#061020]">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  NETWORK_COLORS[network as Network]
                } mr-1`}
              ></div>
              <Globe className="h-4 w-4 text-gray-300" />
            </div>
            <SelectValue placeholder="Select Network" className="text-sm">
              {NETWORKS[network as Network]}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white min-w-[180px] rounded-md shadow-lg">
          {Object.entries(NETWORKS).map(([value, label]) => (
            <SelectItem
              key={value}
              value={value}
              className="cursor-pointer hover:bg-[#061020] focus:bg-[#061020] rounded-sm py-2 px-2 text-sm"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      NETWORK_COLORS[value as Network]
                    }`}
                  ></div>
                  <span>{label}</span>
                </div>
                {value === network && (
                  <Check className="h-4 w-4 text-blue-400" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Mobile-friendly tooltip */}
      <div className="absolute -bottom-8 left-0 text-xs text-gray-400 hidden sm:block">
        Current: {NETWORKS[network as Network]}
      </div>
    </motion.div>
  );
}

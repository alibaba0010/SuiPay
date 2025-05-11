export const generateVerificationCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const formatBalance = (balance: string | BigInt) => {
  let formattedBalance;
  if (typeof balance === "bigint") {
    formattedBalance = Number(balance) / 1_000_000;
  } else {
    formattedBalance = Number(balance) / 1_000_000_000;
  }
  const formattedBalanceStr = formattedBalance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formattedBalanceStr;
};

/**
 * Shortens an address by displaying first and last few characters with ellipsis
 * @param address The full address to shorten
 * @param startChars Number of characters to show at start (default: 6)
 * @param endChars Number of characters to show at end (default: 4)
 * @returns Shortened address string with ellipsis
 */
export const shortenAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

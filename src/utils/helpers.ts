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

import { Transaction } from "@/components/dashboard";
export const exportTransactions = (
  transactions: Transaction[],
  format: "csv" | "json" = "csv"
) => {
  const formatData = () => {
    if (format === "json") {
      return JSON.stringify(
        transactions.map((tx) => ({
          transactionDigest: tx.transactionDigest,
          sender: tx.sender,
          receiver: tx.receiver,
          amount: tx.amount,
          status: tx.status,
          timestamp: new Date(tx.timestamp).toISOString(),
          type: tx.type,
        })),
        null,
        2
      );
    }

    // CSV format
    const headers = [
      "Transaction ID",
      "Sender",
      "Receiver",
      "Amount",
      "Status",
      "Date",
      "Type",
    ];
    const rows = transactions.map((tx) => [
      tx.transactionDigest,
      tx.sender,
      tx.receiver,
      tx.amount,
      tx.status,
      new Date(tx.timestamp).toISOString(),
      tx.type,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const data = formatData();
  const blob = new Blob([data], {
    type:
      format === "csv"
        ? "text/csv;charset=utf-8;"
        : "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `transactions_${new Date().toISOString().split("T")[0]}.${format}`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

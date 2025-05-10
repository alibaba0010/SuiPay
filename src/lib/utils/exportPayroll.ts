import { Payroll } from "@/types/payroll";

export const exportPayrolls = (
  payrolls: Payroll[],
  format: "csv" | "json" = "csv"
) => {
  const formatData = () => {
    if (format === "json") {
      return JSON.stringify(
        payrolls.map((payroll) => ({
          name: payroll.name,
          totalAmount: payroll.totalAmount,
          recipientsCount: payroll.recipients?.length || 0,
          recipients: payroll.recipients?.map((recipient) => ({
            address: recipient.address,
            amount: recipient.amount,
          })),
          createdAt: new Date(payroll.createdAt).toISOString(),
        })),
        null,
        2
      );
    }

    // CSV format
    const headers = [
      "Name",
      "Total Amount",
      "Recipients Count",
      "Recipients",
      "Created Date",
      "Status",
    ];

    const rows = payrolls.map((payroll) => [
      payroll.name,
      payroll.totalAmount?.toFixed(2),
      payroll.recipients?.length || 0,
      payroll.recipients?.map((r) => `${r.address}(${r.amount})`).join(";"),
      new Date(payroll.createdAt).toISOString(),
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
    `payrolls_${new Date().toISOString().split("T")[0]}.${format}`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

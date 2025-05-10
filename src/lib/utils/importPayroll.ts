import { Payroll } from "@/types/payroll";

export const importPayrolls = async (file: File): Promise<Payroll[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (extension === "json") {
          const payrolls = JSON.parse(e.target?.result as string);
          resolve(payrolls);
        } else if (extension === "csv") {
          const csv = e.target?.result as string;
          const lines = csv.split("\n");

          const payrolls = lines.slice(1).map((line) => {
            const values = line.split(",");
            return {
              id: crypto.randomUUID(), // Generate a unique ID
              name: values[0],
              totalAmount: parseFloat(values[1]),
              recipientsCount: parseInt(values[2]),
              recipients: values[3].split(";").map((recipient) => {
                const [address, amount] = recipient.split("(");
                return {
                  address,
                  amount: parseFloat(amount.replace(")", "")),
                };
              }),
              createdAt: new Date(values[4]),
              updatedAt: new Date(), // Set current date as updatedAt
              ownerAddress: "", // Set appropriate default or get from somewhere
              status: values[5],
            };
          });

          resolve(payrolls);
        } else {
          reject(new Error("Unsupported file format"));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    if (file.type === "application/json") {
      reader.readAsText(file);
    } else if (file.type === "text/csv") {
      reader.readAsText(file);
    } else {
      reject(new Error("Unsupported file format"));
    }
  });
};

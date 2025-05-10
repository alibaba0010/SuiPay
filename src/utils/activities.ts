export type ActivityStatus = "pending" | "completed" | "failed";

export interface ActivityItem {
  id: number;
  type: string;
  status: ActivityStatus;
  amount: string;
  recipient: string;
  time: string;
  address: string;
}
export interface PendingApproval extends Omit<Transaction, "status"> {
  status: "pending";
}
export interface ScheduledPayment {
  id: number;
  recipient: string;
  amount: string;
  schedule: string;
  nextPayment: string;
  recipients: number;
}
export interface Transaction {
  id: string;
  status: ActivityStatus;
  amount: string;
  token: string;
  recipient: string;
  sender: string;
  timestamp: number;
}

// Sample data for scheduled payments
export const scheduledPayments: ScheduledPayment[] = [
  {
    id: 1,
    recipient: "Development Team",
    amount: "1,200.0 SUI",
    schedule: "Monthly",
    nextPayment: "July 30, 2023",
    recipients: 4,
  },
  {
    id: 2,
    recipient: "Office Rent",
    amount: "500.0 SUI",
    schedule: "Monthly",
    nextPayment: "August 1, 2023",
    recipients: 1,
  },
  {
    id: 3,
    recipient: "Cloud Services",
    amount: "350.0 SUI",
    schedule: "Monthly",
    nextPayment: "August 5, 2023",
    recipients: 1,
  },
];

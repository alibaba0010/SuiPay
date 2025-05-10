export interface Recipient {
  address: string;
  username?: string;
  email?: string;
  status?: string;
  error?: string;
  errorMessage?: string;
  amount: number;
}

export interface Payroll {
  _id?: string;
  id: string;
  name: string;
  ownerAddress: string;
  status: string;
  recipients: Recipient[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

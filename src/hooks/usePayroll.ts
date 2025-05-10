import { create } from "zustand";
import axios from "axios";
import type { Payroll, Recipient } from "@/types/payroll";

// Add new interface for payroll creation
interface CreatePayrollInput {
  name: string;
  ownerAddress: string;
  recipients: Array<{
    address: string;
    amount: number;
  }>;
  tokenType: "SUI" | "USDC";
}

interface PayrollStore {
  payrolls: Payroll[];
  loading: boolean;
  error: string | null;

  // Update createPayroll type
  createPayroll: (payroll: CreatePayrollInput) => Promise<Payroll>;
  getPayrolls: (address: string) => Promise<Payroll[]>;
  getPayrollByName: (name: string, ownerAddress: string) => Promise<Payroll>;

  // Recipient management
  addRecipient: (
    payrollName: string,
    recipient: Omit<Recipient, "status">
  ) => Promise<Payroll>;
  updateRecipientAmount: (
    payrollName: string,
    recipientAddress: string,
    amount: number
  ) => Promise<Payroll>;
  deleteRecipient: (
    payrollName: string,
    recipientAddress: string
  ) => Promise<Payroll>;
  editRecipientAmount: (
    payrollName: string,
    recipientAddress: string,
    newAmount: number
  ) => Promise<Payroll>;

  deletePayroll: (name: string, payrollId: string) => Promise<void>;
}

export const usePayroll = create<PayrollStore>()((set, get) => ({
  payrolls: [],
  loading: false,
  error: null,

  createPayroll: async (payroll: CreatePayrollInput) => {
    try {
      const payload = {
        name: payroll.name,
        ownerAddress: payroll.ownerAddress,
        recipients: payroll.recipients.map((r) => ({
          address: r.address,
          amount: r.amount,
        })),
        tokenType,
      };

      const response = await axios.post("/api/payrolls", payload);

      // Ensure we update the local state with the server response
      // which includes timestamps and ID
      set((state) => ({
        payrolls: [...state.payrolls, response.data],
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || "Failed to create payroll" });
      throw error;
    }
  },

  getPayrolls: async (address) => {
    try {
      set({ loading: true });
      const response = await axios.get(`/api/payrolls?address=${address}`);
      set({ payrolls: response.data, loading: false, error: null });
      return response.data;
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || "Failed to fetch payrolls",
      });
      return [];
    }
  },

  getPayrollByName: async (name, ownerAddress) => {
    try {
      const response = await axios.get(
        `/api/payrolls/${name}?owner=${ownerAddress}`
      );
      set({ payrolls: response.data, loading: false, error: null });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to fetch payroll",
      });
      throw error;
    }
  },

  addRecipient: async (payrollName, recipient) => {
    try {
      const response = await axios.post(
        `/api/payrolls/${payrollName}/recipients`,
        recipient
      );

      set((state) => ({
        payrolls: state.payrolls.map((p) =>
          p.name === payrollName ? response.data : p
        ),
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to add recipient",
      });
      throw error;
    }
  },

  updateRecipientAmount: async (payrollName, recipientAddress, amount) => {
    try {
      const response = await axios.put(`/api/payrolls/${payrollName}`, {
        recipientAddress,
        amount,
      });

      set((state) => ({
        payrolls: state.payrolls.map((p) =>
          p.name === payrollName ? response.data : p
        ),
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to update recipient",
      });
      throw error;
    }
  },

  deleteRecipient: async (payrollName, recipientAddress) => {
    try {
      const response = await axios.delete(
        `/api/payrolls/${payrollName}?recipient=${recipientAddress}`
      );

      set((state) => ({
        payrolls: state.payrolls.map((p) =>
          p.name === payrollName ? response.data : p
        ),
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to delete recipient",
      });
      throw error;
    }
  },

  editRecipientAmount: async (
    payrollName: string,
    recipientAddress: string,
    newAmount: number
  ) => {
    try {
      const response = await axios.put(`/api/payrolls/${payrollName}`, {
        recipientAddress,
        amount: newAmount,
      });

      // Update the local state with the modified payroll
      set((state) => ({
        payrolls: state.payrolls.map((p) =>
          p.name === payrollName ? response.data : p
        ),
        error: null,
      }));

      return response.data;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.error || "Failed to update recipient amount",
      });
      throw error;
    }
  },

  deletePayroll: async (name: string, payrollId: string) => {
    try {
      set({ loading: true });
      const response = await axios.delete(`/api/payrolls/${name}/${payrollId}`);

      if (response.status === 200) {
        // Update local state by removing the deleted payroll
        set((state) => ({
          payrolls: state.payrolls.filter((p) => p.id !== payrollId),
          loading: false,
          error: null,
        }));

        return response.data;
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.error || "Failed to delete payroll",
      });
      throw error;
    }
  },
}));

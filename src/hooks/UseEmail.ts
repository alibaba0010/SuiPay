import axios from "axios";

interface EmailPayload {
  recipientEmail: string;
  senderEmail: string;
  amount: string;
  token: string;
  verificationCode: string;
}

export const sendPaymentEmail = async (payload: EmailPayload) => {
  try {
    const response = await axios.post("/api/send-payment-email", payload);
    return response.data;
  } catch (error) {
    console.error("Error sending payment email:", error);
    throw error;
  }
};

export const sendBulkPaymentEmails = async (payloads: EmailPayload[]) => {
  try {
    const response = await axios.post("/api/send-payment-email", payloads);
    return response.data;
  } catch (error) {
    console.error("Error sending bulk payment emails:", error);
    throw error;
  }
};

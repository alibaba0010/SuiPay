import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient, useSuiClientInfiniteQuery } from "@mysten/dapp-kit";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { useSubmitTransaction } from "./useSubmitTransaction";
import { MODULE_NAME } from "@/utils/constant";
import { useWalletContext } from "@/lib/wallet-context";
import { useNetworkVariables } from "@/utils/network-config";

export function useContract() {
  const GAS_BUDGET = 50000000; // 50M gas units
  const suiClient = useSuiClient();
  const { executeTransaction } = useSubmitTransaction();
  const { secureTokenPackageId, tokenObjectId } = useNetworkVariables();
  const { walletAddress } = useWalletContext() || {};
  const createUser = async (username: string, email: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::register_user`,
      arguments: [
        tx.object(tokenObjectId),
        tx.pure.string(username),
        tx.pure.string(email),
      ],
    });
    return executeTransaction(tx, {
      successMessage: "User created successfully!",
      errorMessage: "Error in creating user. Please try again.",
      loadingMessage: "Creating user...",
      onSuccess: () => {
        console.log("User created successfully!");
      },
    });
  };

  const getUserByAddress = async (address: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    if (!address) {
      throw new Error("Address is required");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::get_user_by_address`,
      arguments: [tx.object(tokenObjectId), tx.pure.address(address)],
    });

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });
      if (result.effects.status.status === "success") {
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (returnValue) {
          const [bcsData, _] = returnValue;
          const bytes = new Uint8Array(bcsData);

          if (bytes[0] === 1) {
            const structBytes = bytes.slice(1);
            const usernameLength = structBytes[0];
            const username = new TextDecoder().decode(
              structBytes.slice(1, 1 + usernameLength)
            );

            const emailStart = 1 + usernameLength;
            const emailLength = structBytes[emailStart];
            const email = new TextDecoder().decode(
              structBytes.slice(emailStart + 1, emailStart + 1 + emailLength)
            );

            const addressBytes = structBytes.slice(
              emailStart + 1 + emailLength
            );
            const walletAddress =
              "0x" +
              Array.from(addressBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            const userData = {
              username,
              email,
              walletAddress,
            };

            return userData;
          }
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };
  const getUserBalance = async (address: string) => {
    const userCoins = await suiClient.getCoins({
      owner: address,
      coinType:
        "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
    });
    const usdBalance = userCoins.data.reduce(
      (sum, c) => sum + BigInt(c.balance),
      BigInt(0)
    );
    const balance = await suiClient.getBalance({
      owner: address,
    });
    return { suiBalance: balance.totalBalance, usdBalance };
  };
  const getUserByEmail = async (email: string, address: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::get_user_by_email`,
      arguments: [tx.object(tokenObjectId), tx.pure.string(email)],
    });

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });
      if (result.effects.status.status === "success") {
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (returnValue) {
          const [bcsData, _] = returnValue;
          const bytes = new Uint8Array(bcsData);

          // The first byte (1) indicates Some variant of Option
          if (bytes[0] === 1) {
            // Skip the first byte (Option variant) and decode the struct
            const structBytes = bytes.slice(1);

            // The next bytes are the username length followed by the username
            const usernameLength = structBytes[0];
            const username = new TextDecoder().decode(
              structBytes.slice(1, 1 + usernameLength)
            );

            // Skip username and its length to get to email
            const emailStart = 1 + usernameLength;
            const emailLength = structBytes[emailStart];
            const userEmail = new TextDecoder().decode(
              structBytes.slice(emailStart + 1, emailStart + 1 + emailLength)
            );

            // The remaining bytes are the wallet address
            const addressBytes = structBytes.slice(
              emailStart + 1 + emailLength
            );
            const walletAddress =
              "0x" +
              Array.from(addressBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            return {
              username,
              email: userEmail,
              walletAddress,
            };
          }
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  };
  const getUserByUsername = async (username: string, address: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::get_user_by_username`,
      arguments: [tx.object(tokenObjectId), tx.pure.string(username)],
    });

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });
      if (result.effects.status.status === "success") {
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (returnValue) {
          const [bcsData, _] = returnValue;
          const bytes = new Uint8Array(bcsData);

          // The first byte (1) indicates Some variant of Option
          if (bytes[0] === 1) {
            // Skip the first byte (Option variant) and decode the struct
            const structBytes = bytes.slice(1);

            // The next bytes are the username length followed by the username
            const usernameLength = structBytes[0];
            const userUsername = new TextDecoder().decode(
              structBytes.slice(1, 1 + usernameLength)
            );

            // Skip username and its length to get to email
            const emailStart = 1 + usernameLength;
            const emailLength = structBytes[emailStart];
            const email = new TextDecoder().decode(
              structBytes.slice(emailStart + 1, emailStart + 1 + emailLength)
            );

            // The remaining bytes are the wallet address
            const addressBytes = structBytes.slice(
              emailStart + 1 + emailLength
            );
            const walletAddress =
              "0x" +
              Array.from(addressBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            return {
              username: userUsername,
              email,
              walletAddress,
            };
          }
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return null;
    }
  };
  const getAllUsernames = async (address: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::get_all_usernames`,
      arguments: [tx.object(tokenObjectId)],
    });

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });
      if (result.effects.status.status === "success") {
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (returnValue) {
          const [bcsData, _] = returnValue;
          const bytes = new Uint8Array(bcsData);

          // Decode the vector of strings
          const usernames: string[] = [];
          let offset = 0;

          // First byte is the length of the vector
          const length = bytes[offset++];

          for (let i = 0; i < length; i++) {
            // Each string is prefixed with its length
            const strLength = bytes[offset++];
            const username = new TextDecoder().decode(
              bytes.slice(offset, offset + strLength)
            );
            usernames.push(username);
            offset += strLength;
          }

          return usernames;
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching usernames:", error);
      return [];
    }
  };
  const getAllEmails = async (address: string) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${secureTokenPackageId}::${MODULE_NAME}::get_all_emails`,
      arguments: [tx.object(tokenObjectId)],
    });

    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });
      if (result.effects.status.status === "success") {
        const returnValue = result.results?.[0]?.returnValues?.[0];
        if (returnValue) {
          const [bcsData, _] = returnValue;
          const bytes = new Uint8Array(bcsData);

          // Decode the vector of strings
          const emails: string[] = [];
          let offset = 0;

          // First byte is the length of the vector
          const length = bytes[offset++];

          for (let i = 0; i < length; i++) {
            // Each string is prefixed with its length
            const strLength = bytes[offset++];
            const email = new TextDecoder().decode(
              bytes.slice(offset, offset + strLength)
            );
            emails.push(email);
            offset += strLength;
          }

          return emails;
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching emails:", error);
      return [];
    }
  };

  const sendPaymentDirectly = async (recipient: string, amount: number) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = new Transaction();
      // Split coins from gas for the exact amount in MIST

      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", amount)]);

      // Set a gas budget for the transaction
      tx.setGasBudget(GAS_BUDGET); // Increased to 30M gas units

      // Use init_transfer instead of send_funds_directly
      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::send_funds_directly`,
        arguments: [tx.object(tokenObjectId), tx.pure.address(recipient), coin],
      });
      console.log(tx);
      const result = await executeTransaction(tx, {
        successMessage: "Token sent successfully!",
        errorMessage: "Error in sending token user. Please try again.",
        loadingMessage: "Sending Token...",
        onSuccess: () => {
          console.log("Payment made successfully!");
        },
      });
      return {
        success: true,
        data: {
          transactionId: result,
          recipient,
          amount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in sendPayment Directly:", error);
      throw error;
    }
  };
  const sendPayment = async (recipient: string, amount: number) => {
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = new Transaction();

      // 1. Split the required amount from sender's coin
      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", amount)]);
      console.log("GAS BUDJET: ", GAS_BUDGET);
      console.log(typeof GAS_BUDGET);
      tx.setGasBudget(GAS_BUDGET); // Increased to 30M gas units
      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::init_transfer`,
        arguments: [tx.object(tokenObjectId), coin, tx.pure.address(recipient)],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Token sent successfully!",
        errorMessage: "Error in sending token user. Please try again.",
        loadingMessage: "Sending Token...",
        onSuccess: () => {
          console.log("Payment made successfully!");
        },
      });
      return {
        success: true,
        data: {
          transactionId: result,
          recipient,
          amount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in send payment: ", error);
      throw error;
    }
  };

  const sendBulkPayment = async (
    recipients: string[],
    amounts: number[],
    totalAmount: number
  ) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }

    try {
      const tx = new Transaction();

      const amountsInMist = amounts.map((amount) => {
        // Convert amount to MIST with decimal handling
        const amountInMist = Math.round(amount * 1_000_000_000);
        return BigInt(amountInMist);
      });

      // Calculate total amount in MIST
      const totalAmountInMist = BigInt(Math.round(totalAmount * 1_000_000_000));

      // Validate total amount matches sum of individual amounts
      const sumOfAmounts = amountsInMist.reduce((a, b) => a + b, BigInt(0));
      if (sumOfAmounts !== totalAmountInMist) {
        throw new Error(
          "Total amount does not match sum of individual amounts"
        );
      }

      // Split coins for the total amount
      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", totalAmountInMist)]);

      // Call send_bulk_funds_directly
      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::send_bulk_funds_directly`,
        arguments: [
          tx.object(tokenObjectId),
          tx.pure.vector("address", recipients),
          tx.pure.vector("u64", amountsInMist),
          coin,
        ],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Bulk transfer completed successfully!",
        errorMessage: "Failed to complete bulk transfer",
        loadingMessage: "Processing bulk transfer...",
      });

      return {
        success: true,
        data: {
          transactionId: result,
          recipients,
          amounts,
          totalAmount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in bulk payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };
  const claimFunds = async (amount: number) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    try {
      const tx = new Transaction();
      // Split coins from gas for the exact amount in MIST
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));

      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", amountInMist)]);

      tx.setGasBudget(GAS_BUDGET);

      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::claim_funds`,
        arguments: [tx.object(tokenObjectId), coin],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Funds claimed successfully!",
        errorMessage: "Error in claiming funds. Please try again.",
        loadingMessage: "Claiming Funds...",
        onSuccess: () => {
          console.log("Funds claimed successfully!");
        },
      });
      return {
        success: true,
        data: {
          transactionId: result,
          amount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in claimFunds:", error);
      throw error;
    }
  };
  const sendSecureBulkPayment = async (
    recipients: string[],
    amounts: number[],
    totalAmount: number
  ) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    try {
      const tx = new Transaction();
      tx.setGasBudget(GAS_BUDGET);

      const amountsInMist = amounts.map((amount) => {
        const amountInMist = Math.round(amount * 1_000_000_000);
        return BigInt(amountInMist);
      });

      // Calculate total amount in MIST
      const totalAmountInMist = BigInt(Math.round(totalAmount * 1_000_000_000));

      // Validate total amount matches sum of individual amounts
      const sumOfAmounts = amountsInMist.reduce((a, b) => a + b, BigInt(0));
      if (sumOfAmounts !== totalAmountInMist) {
        throw new Error(
          "Total amount does not match sum of individual amounts"
        );
      }

      // Split coins for the total amount
      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", totalAmountInMist)]);

      // Call send_bulk_funds_directly
      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::init_bulk_transfer`,
        arguments: [
          tx.object(tokenObjectId),
          tx.pure.vector("address", recipients),
          tx.pure.vector("u64", amountsInMist),
          coin,
        ],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Secure bulk transfer completed successfully!",
        errorMessage: "Failed to complete secure bulk transfer",
        loadingMessage: "Processing secure bulk transfer...",
      });

      return {
        success: true,
        data: {
          transactionId: result,
          recipients,
          amounts,
          totalAmount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in secure bulk payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };
  const refundFunds = async (amount: number) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    try {
      const tx = new Transaction();
      // Split coins from gas for the exact amount in MIST
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));

      const [coin] = tx.splitCoins(tx.gas, [tx.pure("u64", amountInMist)]);

      tx.setGasBudget(GAS_BUDGET);

      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::refund_funds`,
        arguments: [tx.object(tokenObjectId), coin],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Refunds successfully!",
        errorMessage: "Error in claiming refunds. Please try again.",
        loadingMessage: "Claiming Refunds...",
        onSuccess: () => {
          console.log("Refunds successfully!");
        },
      });
      return {
        success: true,
        data: {
          transactionId: result,
          amount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in refunds:", error);
      throw error;
    }
  };

  const createPayroll = async (
    name: string,
    recipients: string[],
    amounts: number[],
    totalAmount: number
  ) => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!tokenObjectId) {
      throw new Error("Token object ID is not defined");
    }
    try {
      const tx = new Transaction();

      tx.setGasBudget(GAS_BUDGET);

      // Convert amounts to MIST
      const amountsInMist = amounts.map((amount) => {
        const amountInMist = Math.round(amount * 1_000_000_000);
        return BigInt(amountInMist);
      });

      // Calculate total amount in MIST
      const totalAmountInMist = BigInt(Math.round(totalAmount * 1_000_000_000));

      // Validate total
      const sumOfAmounts = amountsInMist.reduce((a, b) => a + b, BigInt(0));
      if (sumOfAmounts !== totalAmountInMist) {
        throw new Error(
          "Total amount does not match sum of individual amounts"
        );
      }

      tx.moveCall({
        target: `${secureTokenPackageId}::${MODULE_NAME}::create_payroll`,
        arguments: [
          tx.object(tokenObjectId),
          tx.pure.string(name),
          tx.pure.vector("address", recipients),
          tx.pure.vector("u64", amountsInMist),
        ],
      });

      const result = await executeTransaction(tx, {
        successMessage: "Payroll created successfully!",
        errorMessage: "Failed to create payroll",
        loadingMessage: "Creating payroll...",
      });

      return {
        success: true,
        data: {
          transactionId: result,
          name,
          recipients,
          amounts,
          totalAmount,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in creating payroll:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  return {
    createUser,
    getUserByAddress,
    getUserBalance,
    getUserByEmail,
    getUserByUsername,
    getAllUsernames,
    getAllEmails,
    sendPayment,
    sendPaymentDirectly,
    claimFunds,
    sendBulkPayment,
    sendSecureBulkPayment,
    refundFunds,
    createPayroll,
  };
}

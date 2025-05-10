import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useToast } from "@/components/ui/use-toast";

export const useSubmitTransaction = () => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { toast } = useToast();

  const executeTransaction = async (
    tx: any,
    {
      onSuccess = () => {},
      onError = () => {},
      successMessage = "Transaction successful!",
      errorMessage = "Transaction failed. Please try again.",
      loadingMessage = "Processing transaction...",
    } = {}
  ) => {
    try {
      const loadingToast = toast({
        title: "Processing Transaction",
        description: "Please wait while we process your transaction...",
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async ({ digest }) => {
              try {
                const result = await suiClient.waitForTransaction({
                  digest: digest,
                  options: { showEffects: true },
                });

                if (result?.effects?.status.status === "success") {
                  loadingToast.dismiss();
                  toast({
                    title: "Transaction Successful",
                    description:
                      "Your payment has been processed successfully.",
                  });
                  resolve(digest);
                } else {
                  loadingToast.dismiss();
                  toast({
                    title: "Transaction Failed",
                    description: "There was an error processing your payment.",
                    variant: "destructive",
                  });
                  reject(new Error("Transaction failed"));
                }
              } catch (error) {
                loadingToast.dismiss();
                toast({
                  title: "Transaction Error",
                  description:
                    error instanceof Error
                      ? error.message
                      : "An unknown error occurred",
                  variant: "destructive",
                });
                console.error("Transaction verification error:", error);
                reject(error);
              }
            },
            onError: (error) => {
              loadingToast.dismiss();
              toast({
                title: "Transaction Error",
                description:
                  error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
                variant: "destructive",
              });
              console.error("Transaction error:", error);
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      toast({
        title: "Transaction Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  return { executeTransaction };
};

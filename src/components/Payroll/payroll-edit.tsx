"use client";

import { useState } from "react";
import { ArrowLeft, Save, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { usePayroll } from "@/hooks/usePayroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Payroll } from "@/types/payroll";

interface PayrollEditProps {
  payroll: Payroll;
  onBack: () => void;
}

export function PayrollEdit({ payroll, onBack }: PayrollEditProps) {
  const { toast } = useToast();
  const { editRecipientAmount, deleteRecipient } = usePayroll();
  const [payrollName, setPayrollName] = useState(payroll.name || "");
  const [recipients, setRecipients] = useState(
    payroll.recipients && payroll.recipients.length > 0
      ? [...payroll.recipients]
      : []
  );

  // State for edit amount dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRecipient, setCurrentRecipient] = useState<{
    index: number;
    address: string;
    oldAmount: number;
    newAmount: number;
  } | null>(null);

  const openEditDialog = (index: number, oldAmount: number) => {
    setCurrentRecipient({
      index,
      address: recipients[index].address,
      oldAmount,
      newAmount: oldAmount, // Initialize with old amount
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (index: number) => {
    setCurrentRecipient({
      index,
      address: recipients[index].address,
      oldAmount: recipients[index].amount,
      newAmount: recipients[index].amount,
    });
    setDeleteDialogOpen(true);
  };

  const handleAmountChange = async (index: number, value: string) => {
    const newRecipients = [...recipients];
    const amount = Number.parseFloat(value);
    const newAmount = isNaN(amount) ? 0 : amount;

    newRecipients[index] = {
      ...newRecipients[index],
      amount: newAmount,
    };
    setRecipients(newRecipients);
  };

  const handleEditDialogAmountChange = (value: string) => {
    if (!currentRecipient) return;

    const amount = Number.parseFloat(value);
    const newAmount = isNaN(amount) ? 0 : amount;

    setCurrentRecipient({
      ...currentRecipient,
      newAmount,
    });
  };

  const confirmAmountEdit = async () => {
    if (!currentRecipient) return;

    try {
      await editRecipientAmount(
        payroll.name,
        currentRecipient.address,
        currentRecipient.newAmount
      );

      const newRecipients = [...recipients];
      newRecipients[currentRecipient.index] = {
        ...newRecipients[currentRecipient.index],
        amount: currentRecipient.newAmount,
      };

      setRecipients(newRecipients);
      setEditDialogOpen(false);

      toast({
        title: "Success",
        description: "Recipient amount updated successfully",
      });
    } catch (error) {
      console.error("Error updating recipient amount:", error);
      toast({
        title: "Error",
        description: "Failed to update recipient amount",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!currentRecipient) return;

    try {
      await deleteRecipient(payroll.name, currentRecipient.address);

      // Remove recipient from the list
      const newRecipients = [...recipients];
      newRecipients.splice(currentRecipient.index, 1);

      // Update recipients state
      setRecipients(newRecipients);
      setDeleteDialogOpen(false);

      toast({
        title: "Success",
        description: `Recipient deleted successfully. Total amount reduced by ${currentRecipient.oldAmount} SUI`,
      });
    } catch (error) {
      console.error("Error deleting recipient:", error);
      toast({
        title: "Error",
        description: "Failed to delete recipient",
        variant: "destructive",
      });
    }
  };

  const addNewRecipient = () => {
    setRecipients([
      ...recipients,
      {
        username: "",
        email: "",
        address: "",
        amount: 0,
      },
    ]);
  };

  const handleRecipientFieldChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newRecipients = [...recipients];
    newRecipients[index] = {
      ...newRecipients[index],
      [field]: value,
    };
    setRecipients(newRecipients);
  };

  const handleSave = () => {
    // Here you would implement the actual save functionality
    toast({
      title: "Payroll updated",
      description: "Your changes have been saved successfully.",
    });
    onBack();
  };

  const calculateTotalAmount = () => {
    return recipients.reduce((sum, recipient) => {
      const amount =
        typeof recipient.amount === "number" ? recipient.amount : 0;
      return sum + amount;
    }, 0);
  };

  return (
    <div className="bg-[#051029] min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Edit Payroll</h1>
        </div>

        <div className="space-y-8">
          <div>
            <label
              htmlFor="payrollName"
              className="block text-sm font-medium mb-2"
            >
              Payroll Name
            </label>
            <Input
              id="payrollName"
              value={payrollName}
              onChange={(e) => setPayrollName(e.target.value)}
              className="bg-[#0a1930] border-[#1a2a40] text-white w-full"
              placeholder="Enter payroll name"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recipients</h2>
              <Button
                onClick={addNewRecipient}
                className="bg-white text-[#051029] hover:bg-gray-200 rounded-md px-4 py-2 text-sm font-medium"
              >
                Add Recipient
              </Button>
            </div>

            <div className="bg-[#0a1930] rounded-lg border border-[#1a2a40] overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_2fr_1fr_120px] gap-4 p-4 border-b border-[#1a2a40] text-sm text-gray-400">
                <div>Username</div>
                <div>Email</div>
                <div>Address</div>
                <div>Amount (SUI)</div>
                <div className="text-center">Actions</div>
              </div>

              {recipients.length > 0 ? (
                recipients.map((recipient, index) => (
                  <div
                    key={`recipient-${index}`}
                    className="grid grid-cols-[1fr_1fr_2fr_1fr_120px] gap-4 p-4 border-b border-[#1a2a40] items-center"
                  >
                    <div>
                      <Input
                        value={recipient.username || ""}
                        onChange={(e) =>
                          handleRecipientFieldChange(
                            index,
                            "username",
                            e.target.value
                          )
                        }
                        className="bg-[#051029] border-[#1a2a40] text-white h-10"
                      />
                    </div>
                    <div>
                      <Input
                        value={recipient.email || ""}
                        onChange={(e) =>
                          handleRecipientFieldChange(
                            index,
                            "email",
                            e.target.value
                          )
                        }
                        className="bg-[#051029] border-[#1a2a40] text-white h-10"
                      />
                    </div>
                    <div>
                      <Input
                        value={recipient.address || ""}
                        onChange={(e) =>
                          handleRecipientFieldChange(
                            index,
                            "address",
                            e.target.value
                          )
                        }
                        className="bg-[#051029] border-[#1a2a40] text-white h-10 font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={recipient.amount || ""}
                        onChange={(e) =>
                          handleAmountChange(index, e.target.value)
                        }
                        className="bg-[#051029] border-[#1a2a40] text-white h-10"
                        step="0.01"
                        min="0"
                      />
                      <button
                        onClick={() => openEditDialog(index, recipient.amount)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-blue-900/20"
                        title="Edit amount"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => openDeleteDialog(index)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-900/20"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No recipients yet. Click "Add Recipient" to add one.
                </div>
              )}

              <div className="flex justify-between items-center p-4 text-sm">
                <div className="font-medium">Total Amount:</div>
                <div className="font-bold text-lg">
                  {calculateTotalAmount().toFixed(2)} SUI
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={onBack}
              variant="blueWhite"
              className="border-[#1a2a40] bg-transparent hover:bg-[#0a1930] text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Amount Confirmation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#0a1930] border-[#1a2a40] text-white">
          <DialogHeader>
            <DialogTitle>Edit Amount</DialogTitle>
            <DialogDescription className="text-gray-400">
              Do you want to edit the amount for this recipient?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="font-mono text-xs truncate">
                  {currentRecipient?.address}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Old Amount</p>
                <p className="font-medium">
                  {currentRecipient?.oldAmount.toFixed(2)} SUI
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">New Amount</p>
                <Input
                  type="number"
                  value={currentRecipient?.newAmount || ""}
                  onChange={(e) => handleEditDialogAmountChange(e.target.value)}
                  className="bg-[#051029] border-[#1a2a40] text-white h-10"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              Change:{" "}
              {(
                (currentRecipient?.newAmount || 0) -
                (currentRecipient?.oldAmount || 0)
              ).toFixed(2)}{" "}
              SUI
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setEditDialogOpen(false)}
              className="border-[#1a2a40] bg-transparent hover:bg-[#0a1930] text-white"
            >
              No
            </Button>
            <Button
              onClick={confirmAmountEdit}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Recipient Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0a1930] border-[#1a2a40] text-white">
          <DialogHeader>
            <DialogTitle>Delete Recipient</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this recipient?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-400">Address</p>
            <p className="font-mono text-xs break-all">
              {currentRecipient?.address}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#1a2a40] bg-transparent hover:bg-[#0a1930] text-white"
            >
              No
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

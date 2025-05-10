import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({
  onClick,
  isLoading,
  className,
}: RefreshButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className={cn("h-8 w-8 text-gray-400 hover:text-blue-400", className)}
    >
      <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
    </Button>
  );
}

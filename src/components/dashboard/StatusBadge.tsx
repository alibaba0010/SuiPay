import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const getVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "active":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "claimed":
        return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "rejected":
        return "bg-red-900/30 text-red-400 border-red-800";
      case "refunded":
        return "bg-purple-900/30 text-purple-400 border-purple-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  return (
    <Badge variant="outline" className={`${getVariant(status)} border`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

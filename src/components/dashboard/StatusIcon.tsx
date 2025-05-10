import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCw,
  ArrowLeftRight,
} from "lucide-react";

interface StatusIconProps {
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
  switch (status) {
    case "active":
      return <Clock className="h-6 w-6 text-yellow-500" />;
    case "completed":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "claimed":
      return <CheckCircle className="h-6 w-6 text-blue-500" />;
    case "rejected":
      return <XCircle className="h-6 w-6 text-red-500" />;
    case "refunded":
      return <ArrowLeftRight className="h-6 w-6 text-orange-500" />;
    default:
      return <RotateCw className="h-6 w-6 text-gray-500" />;
  }
}

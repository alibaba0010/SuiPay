import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | React.ReactNode;
  description: string;
  icon: React.ReactNode;
  variants: any;
  color: string;
}

export function SummaryCard({
  title,
  value,
  description,
  icon,
  variants,
  color,
}: SummaryCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover="hover"
      className="overflow-hidden"
    >
      <Card
        className={`bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative h-full`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`}
        ></div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-md"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 relative z-10">
          <CardTitle className="text-xs sm:text-sm font-medium">
            {title}
          </CardTitle>
          <div className="rounded-full bg-[#061020] p-1.5 border border-[#1a2a40]">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-3 pb-3 pt-0">
          <motion.div
            className="text-lg sm:text-xl font-bold truncate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {value}
          </motion.div>
          <motion.p
            className="text-xs text-gray-300 truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {description}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

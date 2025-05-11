"use client";
import React, { createContext, useContext, useState } from "react";

interface ScheduleContextType {
  upcomingCount: number;
  setUpcomingCount: (count: number) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [upcomingCount, setUpcomingCount] = useState(0);

  return (
    <ScheduleContext.Provider value={{ upcomingCount, setUpcomingCount }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const context = useContext(ScheduleContext);
  if (undefined === context) {
    throw new Error(
      "useScheduleContext must be used within a ScheduleProvider"
    );
  }
  return context;
}

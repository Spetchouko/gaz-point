"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AdminSidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | null>(null);

interface AdminSidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
  // For controlled mode - when sidebar state is managed externally
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  toggleSidebar?: () => void;
}

export function AdminSidebarProvider({
  children,
  defaultOpen = false,
  sidebarOpen,
  setSidebarOpen,
  toggleSidebar,
}: AdminSidebarProviderProps) {
  const isControlled = sidebarOpen !== undefined && setSidebarOpen !== undefined;
  
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const internalToggle = useCallback(() => setInternalOpen((prev) => !prev), []);
  
  const open = isControlled ? sidebarOpen : internalOpen;
  const setOpen = isControlled ? setSidebarOpen : setInternalOpen;
  const toggle = isControlled ? toggleSidebar ?? internalToggle : internalToggle;

  return (
    <AdminSidebarContext.Provider value={{ sidebarOpen: open, setSidebarOpen: setOpen, toggleSidebar: toggle }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error("useAdminSidebar must be used within an AdminSidebarProvider");
  }
  return context;
}
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/sidebar";
import { Menu } from "lucide-react";
import { doLogout } from "../actions/action";

function HamburgerButton({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="h-8 w-8 hover:bg-accent/80 hover:text-accent-foreground transition-all duration-200 rounded-md"
      aria-label="Toggle Sidebar"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("authToken");
      const adminAuth = localStorage.getItem("adminAuth");

      if (token || adminAuth) {
        try {
          // Uncomment ini jika Anda ingin verify token dengan backend
          // await authAPI.verifyToken()
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, hapus dari localStorage
          localStorage.removeItem("authToken");
          localStorage.removeItem("adminAuth");
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };
    checkAuthStatus();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Uncomment ini jika Anda ingin memanggil logout endpoint
      localStorage.removeItem("adminAuth");

      // await authAPI.logout()
      await doLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminAuth");
      // Redirect to login
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {/* Sidebar - hanya muncul ketika sidebarOpen = true */}
      {sidebarOpen && (
        <>
          {/* Overlay untuk mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden transition-opacity duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0">
            <AppSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </>
      )}
      <SidebarInset className={sidebarOpen ? "md:ml-0" : ""}>
        {/* Top Navbar dengan Hamburger Button */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-3 md:px-4 sticky top-0 z-30 backdrop-blur-md bg-background/60 transition-all duration-200">
          <HamburgerButton
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-lg md:text-xl font-semibold text-foreground/90 truncate">
              Ubadari Shop Admin
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="ml-auto bg-transparent"
          >
            Logout
          </Button>
        </header>

        {/* Main Content */}
        <div className="min-h-screen bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

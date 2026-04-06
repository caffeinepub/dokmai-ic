import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { Megaphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useIsAdmin,
  useMaintenanceMode,
  useRecordLoginActivity,
  useSystemAnnouncement,
} from "../hooks/useQueries";
import LoginPage from "../pages/LoginPage";
import MaintenancePage from "../pages/MaintenancePage";
import AppLayout from "./layout/AppLayout";

function AnnouncementPopupModal() {
  const { data: announcement } = useSystemAnnouncement();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (announcement) {
      const dismissed = sessionStorage.getItem("announcement_dismissed");
      if (!dismissed) {
        setOpen(true);
      }
    }
  }, [announcement]);

  const handleClose = () => {
    sessionStorage.setItem("announcement_dismissed", "true");
    setOpen(false);
  };

  if (!announcement) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent
        data-ocid="admin.announcement.dialog"
        style={{
          background: "#0D1F38",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "#EAF2FF",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: "#EAF2FF" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(234,179,8,0.12)",
                border: "1px solid rgba(234,179,8,0.2)",
              }}
            >
              <Megaphone size={16} style={{ color: "#eab308" }} />
            </div>
            System Announcement
          </DialogTitle>
          <DialogDescription
            className="text-sm leading-relaxed pt-2"
            style={{ color: "#9BB0C9" }}
          >
            {announcement}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={handleClose}
            data-ocid="admin.announcement.close_button"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #A855F7)",
              color: "#fff",
              border: "none",
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoginActivityRecorder() {
  const recordLogin = useRecordLoginActivity();
  const hasRecorded = useRef(false);
  const mutate = recordLogin.mutate;

  useEffect(() => {
    if (!hasRecorded.current) {
      hasRecorded.current = true;
      mutate();
    }
  }, [mutate]);

  return null;
}

export default function AuthGate() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: maintenanceMode, isLoading: maintenanceLoading } =
    useMaintenanceMode();
  const { data: isAdmin } = useIsAdmin();

  if (isInitializing) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#071427" }}
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/dokmai-logo-transparent.dim_120x120.png"
            alt="Dokmai IC"
            className="w-16 h-16 animate-pulse"
          />
          <p className="text-[#9BB0C9] text-sm">Initializing...</p>
        </div>
        <Toaster theme="dark" />
      </div>
    );
  }

  // Not logged in
  if (!identity) {
    // Show maintenance page if maintenance mode is active
    // Wait for maintenance query to resolve before deciding
    if (!maintenanceLoading && maintenanceMode === true) {
      return (
        <>
          <MaintenancePage />
          <Toaster theme="dark" />
        </>
      );
    }
    return (
      <>
        <LoginPage />
        <Toaster theme="dark" />
      </>
    );
  }

  // Logged in — if maintenance is active and not admin, show maintenance page
  if (!maintenanceLoading && maintenanceMode === true && isAdmin === false) {
    return (
      <>
        <MaintenancePage />
        <Toaster theme="dark" />
      </>
    );
  }

  return (
    <>
      <LoginActivityRecorder />
      <AnnouncementPopupModal />
      <AppLayout />
      <Toaster theme="dark" />
    </>
  );
}

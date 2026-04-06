import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import LoginPage from "../pages/LoginPage";
import AppLayout from "./layout/AppLayout";

export default function AuthGate() {
  const { identity, isInitializing } = useInternetIdentity();

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

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster theme="dark" />
      </>
    );
  }

  return (
    <>
      <AppLayout />
      <Toaster theme="dark" />
    </>
  );
}

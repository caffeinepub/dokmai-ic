import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronRight,
  HardDriveDownload,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import dokmaiLogo from "/assets/generated/dokmai-logo-v2-transparent.dim_512x512.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLayoutContext } from "../../contexts/LayoutContext";
import { useIsAdmin } from "../../hooks/useQueries";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, path: "/" },
  { key: "passwords", icon: KeyRound, path: "/passwords" },
  { key: "vault", icon: Shield, path: "/vault" },
  { key: "admin", icon: ShieldCheck, path: "/admin" },
  { key: "feedback", icon: MessageSquare, path: "/feedback" },
  { key: "backup", icon: HardDriveDownload, path: "/backup" },
];

const bottomItems = [
  { key: "settings", icon: Settings, path: "/settings" },
  { key: "help", icon: HelpCircle, path: "/help" },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const location = useLocation();
  const {
    data: isAdmin,
    isLoading: isAdminLoading,
    isError: isAdminError,
  } = useIsAdmin();
  const { collapsed, setCollapsed, breakpoint, mobileOpen, setMobileOpen } =
    useLayoutContext();

  const labelMap: Record<string, string> = {
    dashboard: t.navDashboard,
    passwords: t.navPasswords,
    vault: t.navVault,
    admin: t.navAdmin,
    feedback: t.navFeedback,
    backup: t.navBackup,
    settings: t.navSettings,
    help: t.navHelp,
  };

  const visibleNavItems = navItems.filter(
    (item) =>
      item.key !== "admin" ||
      isAdmin === true ||
      isAdminLoading ||
      isAdminError,
  );

  // On mobile: show if mobileOpen, else hidden off-screen
  // On tablet: always show, always collapsed (icons-only)
  // On desktop: always show, collapsed toggle available
  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";

  // For tablet, sidebar is always collapsed (no chevron toggle needed)
  const isCollapsed = isTablet ? true : collapsed;

  const sidebarWidth = isCollapsed ? 72 : 264;

  // Mobile: fixed overlay
  // Tablet/Desktop: fixed sidebar
  const translateX = isMobile && !mobileOpen ? -sidebarWidth : 0;

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      <aside
        className="fixed left-0 top-0 bottom-0 flex flex-col"
        style={{
          width: `${sidebarWidth}px`,
          zIndex: isMobile ? 50 : 40,
          transform: `translateX(${translateX}px)`,
          transition: "transform 300ms ease, width 300ms ease",
          background: "#0A1A31",
          borderRight: "1px solid #1A3354",
          boxShadow:
            "4px 0 24px rgba(0,0,0,0.3), 2px 0 12px rgba(34,211,238,0.04)",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "#1A3354" }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #22D3EE22, #A855F722)",
              border: "1px solid rgba(34,211,238,0.3)",
            }}
          >
            <img
              src={dokmaiLogo}
              alt="Dokmai IC"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="gradient-text font-bold text-lg tracking-tight">
                Dokmai IC
              </span>
              <p className="text-[10px]" style={{ color: "#9BB0C9" }}>
                Identity Vault
              </p>
            </div>
          )}

          {/* Mobile: show X close button */}
          {isMobile && mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "#9BB0C9" }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}

          {/* Desktop only: collapse toggle */}
          {!isMobile && !isTablet && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "#9BB0C9" }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight
                size={16}
                className="transition-transform duration-300"
                style={{
                  transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
                }}
              />
            </button>
          )}
        </div>

        {/* Main Nav */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-2"
          aria-label="Main navigation"
        >
          <ul className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    data-ocid={`nav.${item.key}.link`}
                    title={isCollapsed ? labelMap[item.key] : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                    style={
                      isActive
                        ? {
                            background: "rgba(34, 211, 238, 0.08)",
                            border: "1px solid rgba(34, 211, 238, 0.4)",
                            boxShadow: "0 0 12px rgba(34, 211, 238, 0.2)",
                            color: "#22D3EE",
                            justifyContent: isCollapsed ? "center" : undefined,
                          }
                        : {
                            border: "1px solid transparent",
                            color: "#9BB0C9",
                            justifyContent: isCollapsed ? "center" : undefined,
                          }
                    }
                  >
                    <Icon
                      size={20}
                      className="flex-shrink-0"
                      style={{ color: isActive ? "#22D3EE" : undefined }}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {labelMap[item.key]}
                      </span>
                    )}
                    {isActive && !isCollapsed && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: "#22D3EE",
                          boxShadow: "0 0 6px #22D3EE",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Nav */}
        <div className="py-3 px-2 border-t" style={{ borderColor: "#1A3354" }}>
          <ul className="flex flex-col gap-1">
            {bottomItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    data-ocid={`nav.${item.key}.link`}
                    title={isCollapsed ? labelMap[item.key] : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: "rgba(34, 211, 238, 0.08)",
                            border: "1px solid rgba(34, 211, 238, 0.4)",
                            color: "#22D3EE",
                            justifyContent: isCollapsed ? "center" : undefined,
                          }
                        : {
                            border: "1px solid transparent",
                            color: "#9BB0C9",
                            justifyContent: isCollapsed ? "center" : undefined,
                          }
                    }
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">
                        {labelMap[item.key]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}

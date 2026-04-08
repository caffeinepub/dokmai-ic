import {
  Outlet,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { useLayoutContext } from "./contexts/LayoutContext";
import AdminPage from "./pages/AdminPage";
import BackupPage from "./pages/BackupPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import HelpPage from "./pages/HelpPage";
import PasswordsPage from "./pages/PasswordsPage";
import SettingsPage from "./pages/SettingsPage";
import VaultPage from "./pages/VaultPage";

function RootLayout() {
  const { contentMargin } = useLayoutContext();

  return (
    <div className="flex min-h-screen" style={{ background: "#071427" }}>
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: `${contentMargin}px` }}
      >
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
          <Outlet />
        </main>
        <footer
          className="text-center py-3 text-xs"
          style={{ color: "#9BB0C9", borderTop: "1px solid #1A3354" }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "#22D3EE" }}
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
const passwordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/passwords",
  component: PasswordsPage,
});
const vaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vault",
  component: VaultPage,
});

// /identity and /profile now redirect to /settings
const identityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/identity",
  beforeLoad: () => {
    throw redirect({ to: "/settings" });
  },
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    throw redirect({ to: "/settings" });
  },
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});
const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feedback",
  component: FeedbackPage,
});
const backupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backup",
  component: BackupPage,
});
const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/help",
  component: HelpPage,
});

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  passwordsRoute,
  vaultRoute,
  identityRoute,
  profileRoute,
  adminRoute,
  settingsRoute,
  feedbackRoute,
  backupRoute,
  helpRoute,
]);

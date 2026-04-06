import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import AdminPage from "./pages/AdminPage";
import BackupPage from "./pages/BackupPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import HelpPage from "./pages/HelpPage";
import IdentityPage from "./pages/IdentityPage";
import PasswordsPage from "./pages/PasswordsPage";
import SettingsPage from "./pages/SettingsPage";
import VaultPage from "./pages/VaultPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen" style={{ background: "#071427" }}>
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: "264px" }}
      >
        <Header />
        <main className="flex-1 p-6">
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
  ),
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
const identityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/identity",
  component: IdentityPage,
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
  adminRoute,
  settingsRoute,
  feedbackRoute,
  backupRoute,
  helpRoute,
]);

import { RouterProvider, createRouter } from "@tanstack/react-router";
import { LayoutProvider } from "../../contexts/LayoutContext";
import { routeTree } from "../../routeTree";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppLayout() {
  return (
    <LayoutProvider>
      <RouterProvider router={router} />
    </LayoutProvider>
  );
}

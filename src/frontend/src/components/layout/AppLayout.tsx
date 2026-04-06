import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppLayout() {
  return <RouterProvider router={router} />;
}

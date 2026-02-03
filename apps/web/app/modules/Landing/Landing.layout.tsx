import { Outlet } from "@remix-run/react";

import { CartSidebar } from "~/modules/Cart/CartSidebar";

import { LandingFooter } from "./components/LandingFooter";
import { LandingHeader } from "./components/LandingHeader";

export default function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
      <CartSidebar />
    </div>
  );
}

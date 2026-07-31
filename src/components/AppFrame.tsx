import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationsContext";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Home, Package, Truck, Wallet, User, Bell,
  ChevronDown, LogOut, LifeBuoy, BarChart3, Car,
} from "lucide-react";

const NO_CHROME = new Set(["/login", "/register", "/forgot-password", "/terms"]);

function initialsOf(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  // Must be called unconditionally on every render — useDriverNotifications
  // itself guards internally when there's no signed-in user yet, so this is
  // safe even before auth resolves. Calling it behind a ternary/early-return
  // instead changes the hook count between renders of this same mounted
  // instance, which crashes the whole tree (AppFrame wraps every route).
  const { unread } = useNotifications();

  // Keep login/register pages clean
  if (NO_CHROME.has(path)) {
    return <>{children}</>;
  }

  // Show loading while authentication resolves
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8EC]">
        <div className="text-[#3D2B0E] font-bold">
          Loading...
        </div>
      </div>
    );
  }

  const isDriver = user?.role === "driver";
  const isAdmin = user?.role === "admin";

  const tabs = isDriver
    ? [
        { to: "/driver-loads", label: "Loads", icon: Package },
        { to: "/my-vehicle", label: "Vehicle", icon: Truck },
        { to: "/wallet", label: "Wallet", icon: Wallet },
        { to: "/profile", label: "Profile", icon: User },
      ]
    : isAdmin
    ? [
        { to: "/", label: "Home", icon: Home },
        { to: "/analytics", label: "Analytics", icon: BarChart3 },
        { to: "/support", label: "Support", icon: LifeBuoy },
        { to: "/profile", label: "Profile", icon: User },
      ]
    : [
        { to: "/", label: "Home", icon: Home },
        { to: "/new-booking", label: "Book", icon: Package },
        { to: "/my-bookings", label: "Bookings", icon: Car },
        { to: "/profile", label: "Profile", icon: User },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EC]">

      <header
        className="sticky top-0 z-40 bg-[#3D2B0E] text-white"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/brand/logo-transparent.png"
              alt="Van-Link"
              className="h-8 w-8 object-contain"
            />
            <span className="font-extrabold tracking-tight text-[15px]">
              Van-Link
            </span>
          </Link>


          <div className="flex items-center gap-1">

            {user && (
              <Link
                to="/support"
                className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Bell className="h-[18px] w-[18px]" />

                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#DC2626]" />
                )}
              </Link>
            )}


            {user ? (
              <DropdownMenu>

                <DropdownMenuTrigger className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-lg hover:bg-white/10 transition-colors outline-none">

                  <div className="h-7 w-7 rounded-full bg-[#C9A05A] text-[#3D2B0E] flex items-center justify-center text-[11px] font-extrabold shrink-0">
                    {initialsOf(user.full_name)}
                  </div>

                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />

                </DropdownMenuTrigger>


                <DropdownMenuContent align="end" className="w-56">

                  <DropdownMenuLabel className="truncate">
                    {user.full_name || user.email}

                    <p className="text-xs font-normal text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </DropdownMenuLabel>


                  <DropdownMenuSeparator />


                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      Profile
                    </Link>
                  </DropdownMenuItem>


                  {isDriver && (
                    <DropdownMenuItem asChild>
                      <Link to="/my-vehicle">
                        My vehicle
                      </Link>
                    </DropdownMenuItem>
                  )}


                  <DropdownMenuItem asChild>
                    <Link to="/wallet">
                      Wallet
                    </Link>
                  </DropdownMenuItem>


                  <DropdownMenuItem asChild>
                    <Link to="/support">
                      Support
                    </Link>
                  </DropdownMenuItem>


                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/analytics">
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                  )}


                  <DropdownMenuSeparator />


                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>


                </DropdownMenuContent>

              </DropdownMenu>

            ) : (

              <Link
                to="/login"
                className="text-sm font-bold px-3 h-9 flex items-center rounded-lg bg-[#C9A05A] text-[#3D2B0E]"
              >
                Sign in
              </Link>

            )}

          </div>

        </div>
      </header>


      <main className="flex-1 max-w-lg w-full mx-auto pb-24">
        {children}
      </main>


      {user && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E8D5B7]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >

          <div className="max-w-lg mx-auto grid grid-cols-4">

            {tabs.map(t => {

              const active = path === t.to;
              const Icon = t.icon;

              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="flex flex-col items-center justify-center gap-0.5 py-2.5"
                >

                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: active ? "#3D2B0E" : "#B08A45"
                    }}
                    strokeWidth={active ? 2.4 : 2}
                  />


                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color: active ? "#3D2B0E" : "#B08A45"
                    }}
                  >
                    {t.label}
                  </span>

                </Link>
              );

            })}

          </div>

        </nav>
      )}

    </div>
  );
}

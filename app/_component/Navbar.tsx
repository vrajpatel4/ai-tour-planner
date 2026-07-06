"use client";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  useUser,
  SignOutButton,
  SignInButton,
} from "@clerk/nextjs";
import { Menu, Plane, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import UserMenu from "./UserMenu";
import { useSiteConfig } from "./SiteConfigProvider";
import type { FeatureKey } from "@/app/lib/site-config-defaults";

type NavLink = {
  id: number;
  name: string;
  path: string;
  feature?: FeatureKey;
};

const navLinks: NavLink[] = [
  { id: 1, name: "Home", path: "/" },
  { id: 2, name: "Pricing", path: "/pricing", feature: "pricing" },
  { id: 3, name: "Admin", path: "/admin" },
];

type NavCenterProps = {
  links: NavLink[];
};

const NavCenter = ({ links }: NavCenterProps) => (
  <div className="hidden md:flex items-center justify-center gap-6">
    {links.map((link) => (
      <Link
        key={link.id}
        href={link.path}
        className="text-gray-700 font-medium transition hover:text-[var(--site-primary)]"
      >
        {link.name}
      </Link>
    ))}
  </div>
);

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { config } = useSiteConfig();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const links = navLinks.filter((link) => {
    if (link.name === "Admin" && !isAdmin) {
      return false;
    }

    return !link.feature || config.features[link.feature].enabled;
  });
  const plannerEnabled = config.features.aiPlanner.enabled;

  const handleCreateTrip = () => {
    if (!plannerEnabled) return;
    setMenuOpen(false);
    router.push("/plan-trip-new");
  };

  return (
    <nav className="relative z-10 border-b bg-white/85 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          {config.theme.logoImageUrl ? (
            <Image
              src={config.theme.logoImageUrl}
              alt={config.theme.brandName}
              width={34}
              height={34}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <Plane style={{ color: config.theme.primaryColor }} />
          )}
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            {config.theme.brandName}
          </h1>
        </Link>

        <NavCenter links={links} />

        <div className="hidden items-center gap-4 md:flex">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="px-5 py-2 rounded-md text-white shadow">
                Login
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Button
              onClick={handleCreateTrip}
              disabled={!plannerEnabled}
              className="px-5 py-2 rounded-md text-white transition cursor-pointer"
              title={
                plannerEnabled
                  ? "Create your trip"
                  : config.features.aiPlanner.unavailableMessage
              }
            >
              Create Your Trip
            </Button>

            <SignOutButton>
              <UserMenu />
            </SignOutButton>
          </SignedIn>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-2 text-slate-700 shadow-sm md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t bg-sky-50 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.path}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full rounded-md text-white">Login</Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Button
                onClick={handleCreateTrip}
                disabled={!plannerEnabled}
                className="w-full rounded-md text-white"
              >
                Create Your Trip
              </Button>

              <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                <span className="text-sm text-slate-600">Account</span>
                <SignOutButton>
                  <UserMenu />
                </SignOutButton>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

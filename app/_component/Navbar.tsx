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

const navLinks = [
  { id: 1, name: "Home", path: "/" },
  { id: 2, name: "Explore", path: "/explore" },
  { id: 3, name: "Pricing", path: "/pricing" },
  { id: 4, name: "Contact", path: "/contact" },
];

const NavCenter = () => (
  <div className="hidden md:flex items-center justify-center gap-6">
    {navLinks.map((link) => (
      <Link
        key={link.id}
        href={link.path}
        className="text-gray-700 hover:text-sky-600 font-medium transition"
      >
        {link.name}
      </Link>
    ))}
  </div>
);

const Navbar = () => {
  const router = useRouter();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  console.log({ user });

  return (
    <nav className="relative z-10 bg-sky-100">
      <div className="flex items-center justify-between px-4 py-3 md:px-12">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          <Plane className="text-sky-600" />
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            TravelMate AI
          </h1>
        </div>

        {/* Center Links */}
        <NavCenter />

        {/* Right - Auth / Buttons (Desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="px-5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition shadow">
                Login
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Button
              onClick={() => {
                router.push("/plan-trip-new");
              }}
              className="px-5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition cursor-pointer"
            >
              Create Your Trip
            </Button>

            <SignOutButton>
              <UserMenu />
            </SignOutButton>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-slate-700 shadow-sm md:hidden"
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
            {navLinks.map((link) => (
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
                <Button className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700">
                  Login
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/plan-trip-new");
                }}
                className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700"
              >
                Create Your Trip
              </Button>

              <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
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

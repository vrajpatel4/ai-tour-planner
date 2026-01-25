"use client";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  useUser,
  SignOutButton,
  SignInButton,
} from "@clerk/nextjs";
import { Plane } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import UserMenu from "./UserMenu";

const navLinks = [
  { id: 1, name: "Home", path: "/" },
  { id: 2, name: "Explore", path: "/explore" },
  { id: 3, name: "Contact", path: "/contact" },
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

  console.log({ user });

  return (
    <nav className="flex justify-between items-center px-8 md:px-12 py-6 relative z-10 bg-sky-100 ">
      {/* Left - Logo */}
      <div className="flex items-center gap-2">
        <Plane className="text-sky-600" />
        <h1 className="text-2xl font-bold tracking-tight">TravelMate AI</h1>
      </div>

      {/* Center Links */}
      <NavCenter />

      {/* Right - Auth / Buttons */}
      <div className="flex items-center gap-4">
        {/* When Logged Out */}
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="px-5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition shadow">
              Login
            </Button>
          </SignInButton>
        </SignedOut>

        {/* When Logged In */}
        <SignedIn>
          <Button
            onClick={() => {
              router.push("/plan-trip");
            }}
            className="px-5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition cursor-pointer"
          >
            Create Your Trip
          </Button>

          <SignOutButton>
            <UserMenu />
          </SignOutButton>

          {/* {user?.imageUrl && (
            <Image
              src={user?.imageUrl}
              alt={user.imageUrl}
              width={400}
              height={300}
              className="w-full h-52 object-cover rounded-t-2xl"
              placeholder="blur"
              blurDataURL={user.imageUrl}
            />
          )} */}
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;

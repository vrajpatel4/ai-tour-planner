"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function UserMenu() {
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer border w-10 h-10">
          <AvatarImage src={user?.imageUrl || ""} alt="User Avatar" />
          <AvatarFallback>
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 mr-2">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {user?.fullName || "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer">
            View Profile
          </DropdownMenuItem>
        </Link>

        <Link href="/pricing">
          <DropdownMenuItem className="cursor-pointer">
            Billing & Plans
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <SignOutButton>
          <DropdownMenuItem className="text-red-600 cursor-pointer">
            Logout
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { MaterialIcon } from "@/components/material-icon";
import { NAV_ITEMS } from "@/components/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppTopbar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-background/50 px-md backdrop-blur-xl md:px-xl">
      {/* Mobile: brand + menu */}
      <div className="flex items-center gap-sm md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <MaterialIcon name="menu" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.href}
                className="gap-2"
                render={<Link href={item.href} />}
              >
                <MaterialIcon name={item.icon} className="text-[18px]" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="font-headline-md text-headline-md font-bold text-primary">
          RoadFolio
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-sm md:ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-container">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="size-8 rounded-full border border-outline-variant object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-container font-metadata text-sm font-semibold text-on-primary">
                {initial}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="truncate px-2 py-1.5 font-metadata text-sm font-medium text-on-surface">
              {user.name ?? user.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" render={<Link href="/profile" />}>
              <MaterialIcon name="person" className="text-[18px]" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="gap-2"
            >
              <MaterialIcon name="logout" className="text-[18px]" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

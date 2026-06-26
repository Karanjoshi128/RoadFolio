import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MaterialIcon } from "@/components/material-icon";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary-container shadow-[0_0_24px_rgba(16,185,129,0.4)]">
            <MaterialIcon name="map" fill className="text-on-primary text-[20px]" />
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">
            RoadFolio
          </span>
        </div>
        <h1 className="text-balance font-display text-headline-lg font-bold tracking-tight text-on-surface text-glow sm:text-display">
          Track your learning roadmaps to completion.
        </h1>
        <p className="mt-6 text-pretty font-body-lg text-body-lg text-on-surface-variant">
          Import a roadmap, check off what you finish, and watch your progress
          grow. Built for people who learn by shipping.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signin"
            className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-body-md text-body-md font-semibold text-on-primary shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-primary"
          >
            Get started
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
          <Link
            href="/signin"
            className="glass-panel px-6 py-3 font-body-md text-body-md font-medium text-on-surface transition-colors hover:bg-white/[0.07]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

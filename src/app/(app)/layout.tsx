import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="flex min-h-screen flex-1">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <AppTopbar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
        <main className="mx-auto w-full max-w-container-max flex-1 p-4 md:px-8 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

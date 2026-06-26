import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/signin-form";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <SignInForm googleEnabled={googleEnabled} />
    </main>
  );
}

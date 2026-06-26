import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoadFolio — track your learning roadmaps",
  description:
    "Import a roadmap, track it to completion, and showcase what you build.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols icon font used across the RoadFolio UI */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-full flex flex-col text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

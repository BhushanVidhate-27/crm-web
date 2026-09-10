import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { store } from "@/lib/store";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GymOS — Multi-gym management",
  description: "Owner console to run every branch from one place.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gyms = store.gyms();
  const jar = await cookies();
  const activeGymId = jar.get("gymos_gym")?.value ?? null;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-[var(--background)] text-foreground">
        <div className="flex min-h-screen gap-0">
          <Sidebar gyms={gyms} activeGymId={activeGymId} />
          <div className="flex min-w-0 flex-1 flex-col md:pl-[1px]">
            <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TrialExpiredGate } from "@/components/trial-expired-gate";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorkForce - Smart Workforce Management",
  description:
    "All-in-one workforce management platform with time tracking, scheduling, payroll, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <TrialExpiredGate>{children}</TrialExpiredGate>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

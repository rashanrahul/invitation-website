import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "Aradhana Invitation | Made for your moments",
=======
  title: "Mali Invitation Studio | Made for your moments",
>>>>>>> f772ce5dac82b253244927031c6854178a440a5f
  description:
    "Thoughtfully designed wedding, birthday and event invitations, made personal in Sri Lanka. ඔබේ විශේෂ මොහොතට ලස්සන ආරාධනා.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sinhala.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

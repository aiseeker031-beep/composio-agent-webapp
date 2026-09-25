import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omni Agent",
  description: "Universal AI agent powered by Composio tool discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme-init-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healthcare Doctors Pulse",
  description:
    "Executive healthcare operations portal — UI-first rebuild from the v34 concept",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

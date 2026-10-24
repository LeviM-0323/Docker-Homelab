import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Levi McLean — Projects & Experiments",
  description:
    "A personal corner of the internet for Levi McLean: projects, tinkering, and notes.",
  openGraph: {
    title: "Levi McLean — Projects & Experiments",
    description:
      "A personal corner of the internet for Levi McLean: projects, tinkering, and notes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { brand } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

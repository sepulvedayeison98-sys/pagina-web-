import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel · ROVEX",
  robots: { index: false, follow: false },
};

/** Layout base del panel: fondo claro, sin la nav de la tienda. */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-[100dvh] bg-paper text-text-dark">{children}</div>;
}

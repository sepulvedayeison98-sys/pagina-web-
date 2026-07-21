"use client";

import { usePathname } from "next/navigation";

/**
 * Contenedor del contenido de la tienda. Como el nav es flotante (fixed),
 * en el inicio el hero oscuro va debajo del nav (sin espacio), pero en las
 * demás páginas se reserva un margen superior para no quedar tapadas.
 */
export default function StoreMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = pathname === "/";
  return <main className={home ? "" : "pt-24"}>{children}</main>;
}

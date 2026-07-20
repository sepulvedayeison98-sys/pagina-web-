import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/** Layout de la tienda pública: nav + contenido + footer. */
export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}

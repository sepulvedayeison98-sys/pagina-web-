import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoreMain from "@/components/StoreMain";

/** Layout de la tienda pública: nav flotante + contenido + footer. */
export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      <StoreMain>{children}</StoreMain>
      <Footer />
    </>
  );
}

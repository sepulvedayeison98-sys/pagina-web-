import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoreMain from "@/components/StoreMain";
import { CartProvider } from "@/lib/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

/** Layout de la tienda pública: nav flotante + contenido + footer, con carrito global. */
export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <Nav />
      <StoreMain>{children}</StoreMain>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}

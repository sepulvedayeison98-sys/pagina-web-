import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StoreMain from "@/components/StoreMain";
import { CartProvider } from "@/lib/cart/CartContext";
import { FavoritesProvider } from "@/lib/favorites/FavoritesContext";
import CartDrawer from "@/components/cart/CartDrawer";
import WhatsAppFab from "@/components/WhatsAppFab";

/** Layout de la tienda pública: nav flotante + contenido + footer, con carrito y favoritos globales. */
export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FavoritesProvider>
      <CartProvider>
        <Nav />
        <StoreMain>{children}</StoreMain>
        <Footer />
        <CartDrawer />
        <WhatsAppFab />
      </CartProvider>
    </FavoritesProvider>
  );
}

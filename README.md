# VELTOR

Tienda online de equipamiento premium para motociclistas (cascos, guantes,
accesorios, tecnología). Español (Colombia), precios en COP. Estética "hero
oscuro + resto claro" con acento naranja `#f2661f`.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4** (tokens vía `@theme` en `globals.css`, sin `tailwind.config`)
- **motion** v12 (animación, respeta `prefers-reduced-motion`)
- **lucide-react** (íconos)
- Node 18+

## Cómo correr

```bash
npm install
npm run dev
# http://localhost:3000
# http://localhost:3000/producto/shpro-609
```

## Estructura

```
src/
  app/
    layout.tsx                    # Root layout: fuentes Archivo + JetBrains Mono, Nav, Footer
    page.tsx                      # HOME: hero, trust bar, categorías, catálogo, promo,
                                  #   tecnología, reseñas, comunidad, newsletter
    globals.css                   # Tokens de color/tipografía (@theme, Tailwind v4)
    producto/shpro-609/page.tsx   # Ficha de producto: galería, compra, tabs, sellos, relacionados
  components/                     # Nav, Footer, Wordmark, Cta, Reveal, ProductCard,
                                  #   CatalogSection, ZoomTile, Stars, Placeholder,
                                  #   NewsletterForm, ProductGallery, SizeSelector, ProductTabs
  lib/
    products.ts                   # Datos de productos y reseñas (MOCK — reemplazar por API/CMS)
    format.ts                     # formatCOP()
```

## Pendientes

1. **Fotos reales** de productos y hero. Hoy se muestran placeholders
   "FOTO PRÓXIMAMENTE" (`components/Placeholder.tsx`).
2. **Datos desde API/CMS**: `src/lib/products.ts` es mock.
3. **Carrito real**: el badge de la nav y "Agregar al carrito" son visuales.
4. Rutas adicionales (categoría, listado, blog/FAQ) y guía de tallas real.

## Deploy

Conectar el repositorio a Vercel; detecta Next.js automáticamente. Si el
proyecto vive en la subcarpeta `veltor/`, configurar ese directorio como
*Root Directory* en Vercel.

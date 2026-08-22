# ROVEX

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
proyecto vive en la subcarpeta `rovex/`, configurar ese directorio como
*Root Directory* en Vercel.

## Asesor de ventas de WhatsApp (IA)

`src/app/api/whatsapp/webhook/route.ts` recibe los mensajes de WhatsApp
Cloud API y los responde con un motor comercial (`src/lib/agent/`) que
usa Claude con tools contra Supabase — nunca inventa stock, precio ni
promociones: todo sale de `products`, `inventory` y `site_content`
reales. Las conversaciones, clientes y escalamientos a humano se ven en
`/admin/conversaciones`.

### Variables de entorno necesarias (Vercel → Project Settings → Environment Variables)

| Variable | De dónde sale |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key |
| `WHATSAPP_TOKEN` | Meta for Developers → tu app → WhatsApp → API Setup → token permanente de un *System User* (el temporal expira en 24h) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta for Developers → tu app → WhatsApp → API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Lo inventas tú (cualquier cadena secreta); se usa solo para que Meta verifique el webhook |
| `WHATSAPP_APP_SECRET` | Meta for Developers → tu app → Configuración → Básica → "Clave secreta de la app" |
| `WHATSAPP_GRAPH_VERSION` | Opcional, por defecto `v22.0` |

### Configurar el webhook en Meta

1. Crear una app en [developers.facebook.com](https://developers.facebook.com/apps) → tipo "Business" → añadir el producto **WhatsApp**.
2. Vincular (o crear) el número de WhatsApp Business de ROVEX.
3. En **WhatsApp → Configuration**, poner como *Callback URL* `https://<tu-dominio>/api/whatsapp/webhook` y como *Verify token* el mismo valor de `WHATSAPP_VERIFY_TOKEN`.
4. Suscribirse al campo `messages`.
5. Generar un token permanente (System User con permiso `whatsapp_business_messaging`) en vez del token temporal de pruebas.

Sin estas variables configuradas, el resto de la tienda sigue funcionando
igual — el webhook solo se activa cuando Meta le envía tráfico real.

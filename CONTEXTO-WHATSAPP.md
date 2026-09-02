# Contexto: conectar el asesor de WhatsApp

Documento de traspaso para retomar el trabajo en otra sesión.
Última actualización: sesión del 2026-09-02.

---

## 1. Qué es el proyecto

**ROVEX** — tienda de cascos de moto (Colombia). Next.js 16 con App Router,
Supabase (datos + auth), desplegada en Vercel.

Incluye un **asesor de ventas por WhatsApp**: un agente de Claude que responde
a los clientes con datos reales del catálogo (nunca inventa stock ni precios) y
puede escalar la conversación a un humano.

| Dato | Valor |
|---|---|
| Repo | `github.com/sepulvedayeison98-sys/pagina-web-` |
| Rama | `claude/session-i6704q` — **es la rama de producción y la única del repo**; todo push despliega a producción |
| Dominio | `https://cascorovex.com` |
| Vercel: equipo | `kodrefe-s-projects` (`team_0k365NhOA4avk4q7YpHRCxhe`), plan Hobby |
| Vercel: proyecto | `rovex` (`prj_jeOwKUCJ75EwHmg1noPkmTbTRQ7l`) |
| Supabase | `https://lqqtlhypsophtabckyqa.supabase.co` |
| Modelo del agente | `claude-opus-5` (definido en `src/lib/agent/engine.ts`) |

**Ojo con el plan Hobby:** los logs de runtime se retienen solo 1 hora, así que
casi nunca sirven para diagnosticar algo que pasó ayer.

---

## 2. El problema

**El asesor de WhatsApp no está conectado.** Los mensajes que llegan al número
de WhatsApp Business no producen respuesta.

La causa **no** es una variable de entorno faltante — eso ya se descartó (ver
sección 4).

---

## 3. Qué quiero

Que un cliente escriba al WhatsApp del negocio y el asesor de Claude le
responda automáticamente, usando el catálogo real, y que las conversaciones se
vean en `/admin/conversaciones`.

Todo el código para eso **ya está escrito y desplegado**. Lo que falta es que
la configuración del lado de **Meta** quede correcta.

---

## 4. Qué ya se verificó (no repetir)

### Las 5 variables de entorno están bien ✅

Confirmado en Vercel → proyecto `rovex` → Settings → Environment Variables, con
los nombres exactos correctos:

| Variable | Entorno | Estado |
|---|---|---|
| `WHATSAPP_TOKEN` | Production | ✅ existe |
| `WHATSAPP_PHONE_NUMBER_ID` | Production | ✅ existe |
| `WHATSAPP_VERIFY_TOKEN` | Production | ✅ existe |
| `WHATSAPP_APP_SECRET` | Production | ✅ existe |
| `ANTHROPIC_API_KEY` | Production + Preview | ✅ existe |
| `WHATSAPP_GRAPH_VERSION` | — | opcional, por defecto `v22.0` |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ⚠️ **no está** (ver sección 7) |

> Nota: al mirar esa pantalla con el traductor de Chrome activo, los nombres se
> ven traducidos (`CLAVE_API_ANTRÓPICA`, `TOKEN_DE_WHATSAPP`…). Es solo visual,
> pero confunde: revísala siempre en el original en inglés.

### El endpoint del webhook responde ✅

```
curl "https://cascorovex.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=malo&hub.challenge=123"
→ HTTP 403
```

403 con un token equivocado es el comportamiento correcto: la ruta está
desplegada y la lógica de verificación funciona.

---

## 5. Sospecha principal: la URL del webhook en Meta

El proyecto tiene **Vercel Deployment Protection (SSO) activa**, con alcance
`all_except_custom_domains`.

Es decir: cualquier URL `*.vercel.app` responde con la pantalla de login de
Vercel. **Si la Callback URL configurada en Meta es una `.vercel.app`, Meta
recibe HTML de login en vez del reto de verificación y falla sin explicar por
qué.**

La Callback URL tiene que ser exactamente:

```
https://cascorovex.com/api/whatsapp/webhook
```

**Esto es lo primero que hay que revisar** en Meta for Developers → la app →
WhatsApp → Configuration.

---

## 6. La herramienta de diagnóstico (ya desplegada)

Se construyó una página que verifica todo en vivo contra Graph API:

### 👉 https://cascorovex.com/admin/whatsapp

(pestaña **Conexión** del panel admin; requiere sesión de admin)

Verifica, y para cada falla dice el paso exacto para arreglarla:

1. **Variables de entorno** — cuáles faltan.
2. **Token de WhatsApp** (`/debug_token`) — si es válido, si es permanente o
   temporal, y la fecha de vencimiento. *El token de la pantalla "API Setup" de
   Meta dura 24 h; hace falta uno de System User.*
3. **Permisos del token** — si incluye `whatsapp_business_messaging`.
4. **App secret** — firma una llamada real con `appsecret_proof` para probar que
   el secreto es de la misma app del token. *Este es el fallo silencioso peor:
   si es de otra app, Meta entrega los mensajes pero el webhook los rechaza con
   401 al validar la firma y el cliente nunca recibe nada.*
5. **Número de WhatsApp Business** — que el ID exista y el token lo alcance.
6. **Suscripción de la app a la cuenta (WABA)** — *sin esto Meta nunca llama al
   webhook, aunque la URL aparezca verificada en verde.*
7. **El apretón de manos completo** — hace contra el dominio público la misma
   petición que hace Meta.

Nunca muestra el valor de ningún secreto: solo si Meta lo acepta.

**Siguiente paso concreto:** abrir esa página y arreglar lo que salga en rojo,
en orden.

---

## 7. Pendiente aparte: `SUPABASE_SERVICE_ROLE_KEY`

No está configurada. Mientras falte, `src/lib/supabase/serviceClient.ts` cae de
vuelta al cliente publishable, y las funciones `wa_*` (que son
`SECURITY DEFINER`) **siguen siendo llamables públicamente** por cualquiera con
la clave publishable, saltándose la firma del webhook.

Para cerrarlo: agregar la variable en Vercel (Supabase → Project Settings → API
→ service_role key) y correr la migración que revoca el acceso de
`anon`/`authenticated` a esas RPC.

---

## 8. Mapa de archivos

### WhatsApp / agente

| Archivo | Qué hace |
|---|---|
| `src/app/api/whatsapp/webhook/route.ts` | Webhook de Meta. `GET` = verificación; `POST` = mensajes entrantes. Responde 200 de inmediato y procesa con `after()` porque el agente tarda 10-30 s. |
| `src/lib/whatsapp/client.ts` | Envío de mensajes por Cloud API, verificación de firma HMAC (`X-Hub-Signature-256`) y parseo del payload entrante. |
| `src/lib/whatsapp/diagnostico.ts` | **Nuevo.** Todas las verificaciones contra Graph API descritas arriba. |
| `src/app/admin/whatsapp/page.tsx` | **Nuevo.** Página que muestra el diagnóstico. |
| `src/lib/agent/engine.ts` | Motor: loop de Claude con tools (máx. 6 vueltas). |
| `src/lib/agent/prompt.ts` | System prompt del asesor comercial. |
| `src/lib/agent/tools.ts` | Tools contra Supabase (catálogo, stock, pedidos, escalamiento). |
| `src/lib/agent/testAction.ts` | Server action para probar el agente desde el panel sin WhatsApp. |
| `src/components/admin/AgentTester.tsx` | UI de esa prueba, dentro de `/admin/conversaciones`. |
| `src/components/admin/ConversationsManager.tsx` | Lista de conversaciones en vivo. |
| `src/app/admin/conversaciones/page.tsx` | Página de conversaciones. |

### Supabase / infraestructura

| Archivo | Qué hace |
|---|---|
| `src/lib/supabase/config.ts` | URL y clave publishable (públicas por diseño, van en el código). |
| `src/lib/supabase/client.ts` | Cliente de navegador. |
| `src/lib/supabase/server.ts` | Cliente de servidor con cookies. |
| `src/lib/supabase/serviceClient.ts` | Cliente service role (ver sección 7). |
| `src/lib/supabase/middleware.ts` | Refresca sesión y **protege `/admin`**: sin sesión redirige a `/admin/login`. |
| `src/proxy.ts` | Punto de entrada del middleware. |
| `src/lib/site.ts` | Resuelve la URL pública del sitio. |

**Tablas:** `wa_customers`, `wa_conversations`, `products`, `inventory`,
`orders`, `reviews`, `site_content`.
**RPCs:** `wa_touch_customer`, `wa_get_active_conversation`,
`wa_claim_incoming_message`, `wa_recent_messages`, `wa_log_message`,
`wa_check_stock`, `wa_create_handoff`, `wa_log_event`, `wa_set_draft_order`,
`wa_update_lead`, `place_order`.

> El esquema de la base **no está versionado en el repo**: vive solo en el
> proyecto de Supabase.

### Panel admin

`src/app/admin/` — `page.tsx` (productos), `contenido/`, `inventario/`,
`pedidos/`, `resenas/`, `conversaciones/`, `whatsapp/`, `cuenta/`, `login/`.
Cabecera y pestañas en `src/components/admin/AdminHeader.tsx`.

### Tienda

`src/app/(store)/` — `page.tsx` (portada), `producto/[slug]/`,
`categoria/[slug]/`, `guia-de-tallas/`.
Componentes en `src/components/`: `Hero`, `PromoBanner` (cuadro destacado),
`ComboOffer` (escena de la oferta), `ProductGallery`, `ProductBuy`,
`ProductTabs`, `Nav`, `Footer`, `WhatsAppFab`, etc.
Estilos y tokens de marca en `src/app/globals.css`.
Imágenes en `src/assets/`.

### Config

`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
`postcss.config.mjs`, `README.md`, `AGENTS.md` / `CLAUDE.md`.

---

## 9. Cómo se trabaja aquí

```bash
npm run dev      # desarrollo
npm run build    # verificar que compila antes de subir
npm run lint
```

Push a `claude/session-i6704q` = despliegue a producción. No hay rama base
contra la cual abrir PR.

**Importante (de `AGENTS.md`):** esta versión de Next (16.2.10) tiene cambios
que pueden no coincidir con lo que el modelo recuerda. Consultar
`node_modules/next/dist/docs/` antes de escribir código específico del framework.

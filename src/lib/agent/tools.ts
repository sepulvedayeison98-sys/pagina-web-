import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCombo, getSiteContent } from "@/lib/data";
import { text as contentText } from "@/lib/content";
import { CATEGORIES } from "@/lib/products";
import { siteUrl } from "@/lib/site";

export interface AgentContext {
  supabase: SupabaseClient;
  customerId: string;
  conversationId: string;
  /** Teléfono del remitente de WhatsApp; nunca se le pide al cliente ni al modelo. */
  phone: string;
}

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const STAGES = [
  "nuevo",
  "explorando",
  "interesado",
  "cotizado",
  "pendiente_pago",
  "comprado",
  "entregado",
  "perdido",
] as const;
const OBJECIONES = [
  "precio",
  "talla",
  "color",
  "confianza",
  "envio",
  "pago",
  "calidad",
  "comparacion",
  "tiempo",
  "duda",
] as const;
const MOTIVOS_ESCALAMIENTO = [
  "cliente_lo_solicita",
  "reclamo",
  "garantia",
  "devolucion",
  "problema_pago",
  "problema_pedido",
  "cliente_molesto",
  "negociacion_especial",
  "compra_mayorista",
  "informacion_desconocida",
  "situacion_sensible",
] as const;

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_productos",
    description:
      "Busca cascos activos del catálogo ROVEX por categoría, presupuesto máximo o texto libre. Devuelve precio, tallas, acabado, visor, spoiler, especificaciones técnicas (peso, certificación, interior, cierre, ventilación…) y calificación de cada casco. Usa esto antes de recomendar cualquier producto, mencionar un precio o dar una característica — nunca inventes catálogo.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: CATEGORY_IDS, description: "Tipo de casco." },
        max_price: { type: "number", description: "Presupuesto máximo en pesos colombianos." },
        query: { type: "string", description: "Texto libre para buscar por nombre (ej. '501')." },
      },
    },
  },
  {
    name: "consultar_disponibilidad",
    description:
      "Consulta el stock real de un producto por talla (disponible / últimas unidades / agotado). Úsalo siempre antes de confirmar que hay unidades de una talla.",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug del producto (devuelto por buscar_productos)." },
        size: { type: "string", description: "Talla puntual a consultar. Si se omite, devuelve todas las tallas." },
      },
      required: ["slug"],
    },
  },
  {
    name: "consultar_combo",
    description: "Consulta si hay una oferta combo activa y sus condiciones reales. Solo existe promoción si esta herramienta la devuelve activa.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "buscar_resenas",
    description: "Busca reseñas reales de clientes, generales o de un producto puntual, para usarlas como prueba social genuina. Nunca cites una reseña que esta herramienta no haya devuelto.",
    input_schema: {
      type: "object",
      properties: {
        producto_slug: { type: "string", description: "Slug del producto. Si se omite, trae reseñas generales de la marca." },
      },
    },
  },
  {
    name: "registrar_objecion",
    description: "Registra internamente la objeción real del cliente para analítica comercial. No afecta la respuesta al cliente.",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: [...OBJECIONES] },
        detalle: { type: "string", description: "Breve descripción de la objeción, en tus palabras." },
      },
      required: ["tipo"],
    },
  },
  {
    name: "actualizar_estado_cliente",
    description: "Actualiza silenciosamente la etapa del embudo y el puntaje de intención de compra (0-100) del cliente. Llama esto al final de cada turno.",
    input_schema: {
      type: "object",
      properties: {
        etapa: { type: "string", enum: [...STAGES] },
        score: { type: "integer", minimum: 0, maximum: 100 },
        nota: { type: "string", description: "Nota breve para el equipo comercial." },
      },
      required: ["etapa", "score"],
    },
  },
  {
    name: "guardar_borrador_pedido",
    description: "Guarda el pedido que se está armando (aún no confirmado) para que quede visible en el panel de ROVEX.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug: { type: "string" },
              name: { type: "string" },
              size: { type: "string" },
              qty: { type: "integer", minimum: 1 },
              price: { type: "number" },
            },
            required: ["slug", "size", "qty"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "registrar_pedido",
    description:
      "Registra el pedido definitivo, listo para despachar. Solo después de que el cliente confirmó el resumen final (productos, tallas, total, dirección y forma de pago). Verifica el stock antes de guardar y devuelve error si algo se agotó. El teléfono se toma solo del chat.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Nombre y apellido del cliente." },
        customer_city: { type: "string" },
        direccion: {
          type: "string",
          description: "Dirección completa de entrega: calle y número, barrio, y apto/casa si aplica.",
        },
        indicaciones: {
          type: "string",
          description: "Referencias para el mensajero (portería, color de la casa, horario). Opcional.",
        },
        metodo_pago: { type: "string", enum: ["contraentrega", "transferencia"] },
        envio: {
          type: "string",
          enum: ["gratis_por_monto", "gratis_negociado", "pagado", "por_confirmar"],
          description:
            "gratis_por_monto: la compra llega al mínimo. gratis_negociado: se lo regalaste para cerrar. pagado: tiene costo y ya se lo dijiste. por_confirmar: no hay costo definido en DATOS DEL NEGOCIO.",
        },
        costo_envio: { type: "number", description: "Valor del envío en pesos, solo si envio es 'pagado'." },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug: { type: "string" },
              size: { type: "string" },
              qty: { type: "integer", minimum: 1 },
              color: { type: "string", description: "Color que prefiere el cliente, si lo dijo." },
            },
            required: ["slug", "size", "qty"],
          },
        },
      },
      required: ["customer_name", "customer_city", "direccion", "metodo_pago", "envio", "items"],
    },
  },
  {
    name: "escalar_a_humano",
    description: "Transfiere la conversación a un asesor humano de ROVEX con un resumen del caso.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", enum: [...MOTIVOS_ESCALAMIENTO] },
        resumen: { type: "string", description: "Resumen breve y útil para quien va a atender al cliente." },
      },
      required: ["motivo", "resumen"],
    },
  },
];

/** Ejecuta una tool y devuelve el contenido (string) que se le pasa a Claude como tool_result. */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: AgentContext
): Promise<string> {
  try {
    switch (name) {
      case "buscar_productos":
        return await buscarProductos(input, ctx);
      case "consultar_disponibilidad":
        return await consultarDisponibilidad(input, ctx);
      case "consultar_combo":
        return await consultarCombo();
      case "buscar_resenas":
        return await buscarResenas(input, ctx);
      case "registrar_objecion":
        return await registrarObjecion(input, ctx);
      case "actualizar_estado_cliente":
        return await actualizarEstadoCliente(input, ctx);
      case "guardar_borrador_pedido":
        return await guardarBorradorPedido(input, ctx);
      case "registrar_pedido":
        return await registrarPedido(input, ctx);
      case "escalar_a_humano":
        return await escalarAHumano(input, ctx);
      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado" });
  }
}

/**
 * Consulta el catálogo directamente contra la base de datos.
 *
 * A propósito NO usa getProducts(): esa función cae a productos de ejemplo
 * cuando la base de datos falla, lo que haría que el asesor cotizara cascos
 * que no existen. Aquí, si la consulta falla, se devuelve el error para que
 * el modelo diga que va a verificar en vez de inventar.
 */
async function buscarProductos(input: Record<string, unknown>, ctx: AgentContext) {
  const category = typeof input.category === "string" ? input.category : undefined;
  const maxPrice = typeof input.max_price === "number" ? input.max_price : undefined;
  const query = typeof input.query === "string" ? input.query.trim() : undefined;

  let consulta = ctx.supabase
    .from("products")
    .select(
      "slug,name,category,price,compare_at,badge,sizes,description,model,variant,visor,spoiler,specs,rating,review_count"
    )
    .eq("active", true)
    .eq("is_combo", false);

  if (category) consulta = consulta.eq("category", category);
  if (maxPrice) consulta = consulta.lte("price", maxPrice);
  if (query) consulta = consulta.ilike("name", `%${query}%`);

  const { data, error } = await consulta
    .order("sort_order", { ascending: true })
    .limit(10);

  if (error) return JSON.stringify({ error: error.message });

  const productos = (data ?? []).map((p) => ({
    slug: p.slug,
    name: p.name,
    // Ficha en la tienda: fotos, especificaciones y reseñas, para compartirla.
    url: `${siteUrl()}/producto/${p.slug}`,
    category: p.category,
    price: p.price,
    compareAt: p.compare_at,
    badge: p.badge,
    sizes: p.sizes,
    description: p.description,
    modelo: p.model,
    acabado: p.variant,
    visor: p.visor,
    spoiler: p.spoiler,
    // Peso, certificación, interior, cierre, ventilación…: es con esto que
    // se vende por beneficio y no solo por precio.
    especificaciones: Array.isArray(p.specs)
      ? (p.specs as { label?: string; value?: string }[])
          .filter((sp) => sp?.label && sp?.value)
          .map((sp) => `${String(sp.label).trim()}: ${String(sp.value).trim()}`)
      : [],
    calificacion: p.review_count ? { promedio: p.rating, resenas: p.review_count } : null,
  }));

  return JSON.stringify({ productos });
}

async function consultarDisponibilidad(input: Record<string, unknown>, ctx: AgentContext) {
  const slug = typeof input.slug === "string" ? input.slug : "";
  const size = typeof input.size === "string" ? input.size : null;
  if (!slug) return JSON.stringify({ error: "Falta el slug del producto." });

  const { data, error } = await ctx.supabase.rpc("wa_check_stock", {
    p_slug: slug,
    p_size: size,
  });
  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({ tallas: [], nota: "Sin registro de inventario para ese producto/talla." });
  }
  return JSON.stringify({ tallas: data });
}

async function consultarCombo() {
  const content = await getSiteContent();
  if (contentText(content, "combo.enabled").toLowerCase() !== "si") {
    return JSON.stringify({ activo: false });
  }
  const combo = await getCombo();
  if (!combo) return JSON.stringify({ activo: false });
  return JSON.stringify({
    activo: true,
    nombre: combo.name,
    precio: combo.price,
    compareAt: combo.compareAt,
    opciones: combo.options.map((o) => ({ slug: o.slug, name: o.name, variant: o.variant, sizes: o.sizes })),
    titulo: contentText(content, "combo.title"),
    incluye: contentText(content, "combo.includes"),
  });
}

async function buscarResenas(input: Record<string, unknown>, ctx: AgentContext) {
  const slug = typeof input.producto_slug === "string" ? input.producto_slug : undefined;

  if (!slug) {
    const { data, error } = await ctx.supabase
      .from("reviews")
      .select("author,city,rating,title,body,review_date")
      .is("product_id", null)
      .order("review_date", { ascending: false })
      .limit(4);
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ resenas: data ?? [] });
  }

  const { data: producto } = await ctx.supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!producto) return JSON.stringify({ resenas: [] });

  const { data, error } = await ctx.supabase
    .from("reviews")
    .select("author,city,rating,title,body,review_date")
    .eq("product_id", producto.id)
    .order("review_date", { ascending: false })
    .limit(4);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ resenas: data ?? [] });
}

async function registrarObjecion(input: Record<string, unknown>, ctx: AgentContext) {
  const tipo = typeof input.tipo === "string" ? input.tipo : "duda";
  const detalle = typeof input.detalle === "string" ? input.detalle : null;
  const { error } = await ctx.supabase.rpc("wa_log_event", {
    p_conversation_id: ctx.conversationId,
    p_customer_id: ctx.customerId,
    p_kind: "objection",
    p_payload: { tipo, detalle },
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ ok: true });
}

async function actualizarEstadoCliente(input: Record<string, unknown>, ctx: AgentContext) {
  const etapa = typeof input.etapa === "string" ? input.etapa : "explorando";
  const score = typeof input.score === "number" ? input.score : 0;
  const nota = typeof input.nota === "string" ? input.nota : null;
  const { error } = await ctx.supabase.rpc("wa_update_lead", {
    p_customer_id: ctx.customerId,
    p_stage: etapa,
    p_score: score,
    p_note: nota,
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ ok: true });
}

async function guardarBorradorPedido(input: Record<string, unknown>, ctx: AgentContext) {
  const { error } = await ctx.supabase.rpc("wa_set_draft_order", {
    p_conversation_id: ctx.conversationId,
    p_draft: { items: input.items ?? [] },
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ ok: true });
}

interface ItemPedido {
  slug: string;
  size: string;
  qty: number;
  color?: string;
}

const ENVIO_TEXTO: Record<string, string> = {
  gratis_por_monto: "gratis (la compra llega al mínimo)",
  gratis_negociado: "gratis (regalado por el asesor para cerrar)",
  pagado: "pagado por el cliente",
  por_confirmar: "POR CONFIRMAR: no hay costo definido, confirmarlo con el cliente al despachar",
};

async function registrarPedido(input: Record<string, unknown>, ctx: AgentContext) {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const customerName = str(input.customer_name);
  const customerCity = str(input.customer_city);
  const direccion = str(input.direccion);
  const indicaciones = str(input.indicaciones);
  const metodoPago = str(input.metodo_pago);
  const envio = str(input.envio);
  const costoEnvio = typeof input.costo_envio === "number" ? input.costo_envio : null;
  const items = (Array.isArray(input.items) ? input.items : []) as ItemPedido[];

  const faltan = [
    !customerName && "nombre",
    !customerCity && "ciudad",
    !direccion && "dirección",
    items.length === 0 && "productos",
  ].filter(Boolean);
  if (faltan.length > 0) {
    return JSON.stringify({ error: `Falta: ${faltan.join(", ")}. Pídeselo al cliente antes de registrar.` });
  }

  // Las formas de pago salen del panel: si no está habilitada, no se registra.
  const content = await getSiteContent();
  const aceptaContraentrega = contentText(content, "venta.contraentrega").toLowerCase() !== "no";
  const datosTransferencia = contentText(content, "venta.transferencia").trim();
  if (metodoPago === "contraentrega" && !aceptaContraentrega) {
    return JSON.stringify({ error: "Contraentrega no está habilitada. Ofrece transferencia." });
  }
  if (metodoPago === "transferencia" && !datosTransferencia) {
    return JSON.stringify({ error: "No hay datos de transferencia configurados. Ofrece contraentrega." });
  }
  if (!["contraentrega", "transferencia"].includes(metodoPago)) {
    return JSON.stringify({ error: "Forma de pago inválida." });
  }

  // Stock justo antes de guardar: entre la consulta y el "sí" del cliente
  // puede haberse vendido la última unidad.
  for (const it of items) {
    const { data: filas } = await ctx.supabase.rpc("wa_check_stock", { p_slug: it.slug, p_size: it.size });
    const estado = (filas as { status: string }[] | null)?.[0]?.status;
    if (estado === "agotado") {
      return JSON.stringify({
        error: `${it.slug} en talla ${it.size} se acaba de agotar. No registres el pedido: ofrécele al cliente la alternativa más cercana.`,
      });
    }
  }

  const lineasColor = items
    .filter((it) => str(it.color))
    .map((it) => `- ${it.slug} ${it.size}: color ${str(it.color)}`);
  const nota = [
    `Pedido tomado por el asesor de WhatsApp.`,
    `Dirección: ${direccion}`,
    indicaciones && `Indicaciones: ${indicaciones}`,
    `Pago: ${metodoPago === "contraentrega" ? "contraentrega (paga al recibir)" : "transferencia (verificar comprobante antes de despachar)"}`,
    `Envío: ${ENVIO_TEXTO[envio] ?? envio}${envio === "pagado" && costoEnvio ? ` — ${costoEnvio} COP` : ""}`,
    lineasColor.length > 0 && `Colores:\n${lineasColor.join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await ctx.supabase.rpc("wa_place_order", {
    p_customer_name: customerName,
    p_customer_phone: ctx.phone,
    p_customer_city: customerCity,
    p_items: items.map(({ slug, size, qty }) => ({ slug, size, qty })),
    p_note: nota,
  });
  if (error) return JSON.stringify({ error: error.message });

  const code = data as number;

  // Total de productos con los mismos precios que usa place_order.
  const { data: precios } = await ctx.supabase
    .from("products")
    .select("slug,price")
    .in("slug", items.map((it) => it.slug));
  const precioDe = new Map((precios ?? []).map((p) => [p.slug as string, p.price as number]));
  const totalProductos = items.reduce((n, it) => n + (precioDe.get(it.slug) ?? 0) * (it.qty || 1), 0);
  await ctx.supabase.rpc("wa_update_lead", {
    p_customer_id: ctx.customerId,
    // Con transferencia la venta queda cerrada pero el pago pendiente.
    p_stage: metodoPago === "transferencia" ? "pendiente_pago" : "comprado",
    p_score: 95,
    p_note: `Pedido #${code} registrado por el agente (${metodoPago}).`,
  });
  await ctx.supabase.rpc("wa_log_event", {
    p_conversation_id: ctx.conversationId,
    p_customer_id: ctx.customerId,
    p_kind: "order_created",
    p_payload: { code },
  });
  await ctx.supabase.rpc("wa_set_draft_order", {
    p_conversation_id: ctx.conversationId,
    p_draft: {},
  });

  return JSON.stringify({
    ok: true,
    codigo_pedido: code,
    total_productos: totalProductos,
    metodo_pago: metodoPago,
    // Para que el asesor se los pase al cliente en el mensaje de cierre.
    datos_transferencia: metodoPago === "transferencia" ? datosTransferencia : undefined,
  });
}

async function escalarAHumano(input: Record<string, unknown>, ctx: AgentContext) {
  const motivo = typeof input.motivo === "string" ? input.motivo : "situacion_sensible";
  const resumen = typeof input.resumen === "string" ? input.resumen : "Sin resumen.";
  const { error } = await ctx.supabase.rpc("wa_create_handoff", {
    p_conversation_id: ctx.conversationId,
    p_reason: motivo,
    p_summary: resumen,
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ ok: true });
}

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCombo, getProducts, getSiteContent } from "@/lib/data";
import { text as contentText } from "@/lib/content";
import { CATEGORIES } from "@/lib/products";

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
      "Busca cascos activos del catálogo ROVEX por categoría, presupuesto máximo o texto libre. Usa esto antes de recomendar cualquier producto o mencionar un precio — nunca inventes catálogo.",
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
      "Registra el pedido definitivo en el sistema de ROVEX una vez el cliente confirmó nombre, ciudad, producto(s), talla(s) y cantidad(es). El teléfono se toma automáticamente del chat de WhatsApp.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        customer_city: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug: { type: "string" },
              size: { type: "string" },
              qty: { type: "integer", minimum: 1 },
            },
            required: ["slug", "size", "qty"],
          },
        },
      },
      required: ["customer_name", "customer_city", "items"],
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
        return await buscarProductos(input);
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

async function buscarProductos(input: Record<string, unknown>) {
  const category = typeof input.category === "string" ? input.category : undefined;
  const maxPrice = typeof input.max_price === "number" ? input.max_price : undefined;
  const query = typeof input.query === "string" ? input.query.toLowerCase() : undefined;

  const productos = await getProducts();
  const filtrados = productos
    .filter((p) => !category || p.category === category)
    .filter((p) => !maxPrice || p.price <= maxPrice)
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .slice(0, 8)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      compareAt: p.compareAt ?? null,
      badge: p.badge ?? null,
      sizes: p.sizes,
      description: p.description ?? null,
    }));

  return JSON.stringify({ productos: filtrados });
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

async function registrarPedido(input: Record<string, unknown>, ctx: AgentContext) {
  const customerName = typeof input.customer_name === "string" ? input.customer_name : "";
  const customerCity = typeof input.customer_city === "string" ? input.customer_city : "";
  const items = Array.isArray(input.items) ? input.items : [];
  if (!customerName || items.length === 0) {
    return JSON.stringify({ error: "Falta el nombre del cliente o los productos del pedido." });
  }

  const { data, error } = await ctx.supabase.rpc("place_order", {
    p_customer_name: customerName,
    p_customer_phone: ctx.phone,
    p_customer_city: customerCity,
    p_items: items,
  });
  if (error) return JSON.stringify({ error: error.message });

  const code = data as number;
  await ctx.supabase.rpc("wa_update_lead", {
    p_customer_id: ctx.customerId,
    p_stage: "comprado",
    p_score: 95,
    p_note: `Pedido #${code} registrado por el agente.`,
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

  return JSON.stringify({ ok: true, codigo_pedido: code });
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

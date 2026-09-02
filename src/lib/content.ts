/**
 * Esquema de los textos editables de la tienda.
 *
 * Esta lista es la única fuente de verdad: de aquí salen tanto los valores
 * por defecto que ve el visitante como los campos que aparecen en
 * /admin/contenido. Para añadir un texto editable basta con agregarlo aquí;
 * el formulario del panel se genera solo.
 *
 * Los valores guardados viven en la tabla `site_content` (clave/valor). Si
 * una clave no existe en la base de datos, se usa el `value` de aquí, así
 * que la tienda nunca se queda sin texto.
 */

export interface ContentField {
  key: string;
  label: string;
  value: string;
  /** Campo de varias líneas (párrafos largos). */
  multiline?: boolean;
  /** Aclaración que se muestra bajo el campo en el panel. */
  help?: string;
}

export interface ContentGroup {
  id: string;
  title: string;
  description: string;
  fields: ContentField[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "hero",
    title: "Portada (banner principal)",
    description:
      "Lo primero que ve el visitante, sobre el video de fondo.",
    fields: [
      {
        key: "hero.eyebrow",
        label: "Etiqueta superior",
        value: "Envíos a toda Colombia",
      },
      {
        key: "hero.headline",
        label: "Titular",
        value: "Protección que se siente premium.",
        help: "La última palabra se resalta en rojo automáticamente.",
      },
      {
        key: "hero.subtitle",
        label: "Descripción",
        value:
          "Cascos, guantes y tecnología para motociclistas que no negocian seguridad ni estilo. Diseñado para la ruta colombiana.",
        multiline: true,
      },
      {
        key: "hero.note",
        label: "Nota lateral",
        value:
          "Equipamiento certificado bajo ECE 22.06, con materiales premium y acabados a la altura de cada kilómetro que recorres.",
        multiline: true,
        help: "Solo se muestra en pantallas grandes.",
      },
      {
        key: "hero.cta1",
        label: "Botón principal",
        value: "Ver catálogo",
      },
      {
        key: "hero.cta2",
        label: "Botón secundario",
        value: "Producto destacado",
      },
      {
        key: "hero.cta2Href",
        label: "Enlace del botón secundario",
        value: "/#catalogo",
        help: "Puede ser /#catalogo o la dirección de un producto, por ejemplo /producto/nexx-y-10",
      },
    ],
  },
  {
    id: "heroStats",
    title: "Portada · cifras de confianza",
    description: "Los cuatro datos que aparecen abajo en el banner.",
    fields: [
      { key: "hero.stat1.num", label: "Cifra 1", value: "4.8/5" },
      { key: "hero.stat1.label", label: "Texto 1", value: "Valoración de pilotos" },
      { key: "hero.stat2.num", label: "Cifra 2", value: "+4.800" },
      { key: "hero.stat2.label", label: "Texto 2", value: "Motociclistas en Colombia" },
      { key: "hero.stat3.num", label: "Cifra 3", value: "ECE 22.06" },
      { key: "hero.stat3.label", label: "Texto 3", value: "Certificación homologada" },
      { key: "hero.stat4.num", label: "Cifra 4", value: "1-3 días" },
      { key: "hero.stat4.label", label: "Texto 4", value: "Envío a todo el país" },
    ],
  },
  {
    id: "trust",
    title: "Barra de garantías",
    description: "La franja con los cuatro beneficios, bajo el banner.",
    fields: [
      { key: "trust1.label", label: "Garantía 1 · título", value: "Envío gratis" },
      { key: "trust1.sub", label: "Garantía 1 · detalle", value: "desde $150.000" },
      { key: "trust2.label", label: "Garantía 2 · título", value: "Envíos" },
      { key: "trust2.sub", label: "Garantía 2 · detalle", value: "a todo el país" },
      { key: "trust3.label", label: "Garantía 3 · título", value: "30 días" },
      { key: "trust3.sub", label: "Garantía 3 · detalle", value: "para cambios" },
      { key: "trust4.label", label: "Garantía 4 · título", value: "Pagos" },
      { key: "trust4.sub", label: "Garantía 4 · detalle", value: "contra entrega" },
    ],
  },
  {
    id: "promo",
    title: "Cuadros destacados",
    description:
      "Los tres recuadros bajo el banner principal, cada uno enlaza a una sección de la tienda.",
    fields: [
      { key: "promo1.title", label: "Recuadro 1 · título", value: "Nueva colección" },
      { key: "promo1.badge", label: "Recuadro 1 · etiqueta (opcional)", value: "" },
      { key: "promo1.cta", label: "Recuadro 1 · texto del enlace", value: "Descubrir" },
      // Apuntaba a #categorias, que ya no existe mientras esa sección esté
      // oculta: el recuadro no llevaba a ninguna parte. El catálogo es el
      // destino natural de "Nueva colección".
      { key: "promo1.href", label: "Recuadro 1 · destino del enlace", value: "/#catalogo" },
      { key: "promo2.title", label: "Recuadro 2 · título", value: "Ofertas exclusivas" },
      { key: "promo2.badge", label: "Recuadro 2 · etiqueta (opcional)", value: "Hasta 30% off" },
      { key: "promo2.cta", label: "Recuadro 2 · texto del enlace", value: "Ver ofertas" },
      { key: "promo2.href", label: "Recuadro 2 · destino del enlace", value: "/#combo" },
      { key: "promo3.title", label: "Recuadro 3 · título", value: "Tecnología y rendimiento" },
      { key: "promo3.badge", label: "Recuadro 3 · etiqueta (opcional)", value: "" },
      { key: "promo3.cta", label: "Recuadro 3 · texto del enlace", value: "Explorar" },
      { key: "promo3.href", label: "Recuadro 3 · destino del enlace", value: "/#tecnologia" },
    ],
  },
  {
    id: "categorias",
    title: "Categorías",
    description: "Sección donde el cliente elige el tipo de casco.",
    fields: [
      {
        key: "categorias.enabled",
        label: "Mostrar la sección",
        value: "no",
        help:
          "Escribe «si» para mostrarla o «no» para ocultarla. Está oculta porque las categorías todavía no tienen foto propia y salían con la lámina genérica de la marca. Al volver a mostrarla hay que devolver el enlace «Categorías» del menú y, si quieres, apuntar de nuevo el recuadro 1 de los cuadros destacados a /#categorias.",
      },
      {
        key: "categorias.title",
        label: "Título",
        value: "Encuentra el tuyo",
      },
    ],
  },
  {
    id: "combo",
    title: "Oferta combo",
    description:
      "La oferta destacada de la portada. Los precios y las tallas salen del producto “Combo”, en la pestaña Productos.",
    fields: [
      {
        key: "combo.enabled",
        label: "Mostrar la oferta",
        value: "si",
        help: "Escribe «si» para mostrarla o «no» para ocultarla.",
      },
      { key: "combo.eyebrow", label: "Etiqueta superior", value: "OFERTA ROVEX" },
      {
        key: "combo.title",
        label: "Titular",
        value: "2 cascos 501 por $299.900",
      },
      {
        key: "combo.body",
        label: "Descripción",
        value:
          "Dos cascos para rodar acompañado, con eliminador de olores incluido y envío gratis a todo Colombia.",
        multiline: true,
      },
      {
        key: "combo.includes",
        label: "Qué incluye",
        value:
          "2 cascos ICH 501\nEliminador de olores\nEnvío gratis a todo Colombia\nPago seguro",
        multiline: true,
        help: "Una línea por ítem. Cada una sale con su visto bueno.",
      },
      { key: "combo.cta", label: "Texto del botón", value: "Quiero mi combo" },
      {
        key: "combo.note",
        label: "Nota bajo el botón",
        value:
          "Selecciona las tallas de tus 2 cascos y recibe el combo en tu casa.",
        multiline: true,
      },
      {
        key: "combo.stockNote",
        label: "Aviso de disponibilidad",
        value: "Oferta especial · disponible mientras haya existencias",
        help: "Déjalo vacío si no quieres mostrarlo.",
      },
    ],
  },
  {
    id: "tecnologia",
    title: "Tecnología",
    description: "Los cuatro argumentos técnicos de la marca.",
    fields: [
      { key: "tech.eyebrow", label: "Etiqueta superior", value: "Ingeniería ROVEX" },
      { key: "tech.title", label: "Título", value: "Tecnología en cada detalle" },
      {
        key: "tech.body",
        label: "Descripción",
        value:
          "Cada casco combina materiales certificados, aerodinámica probada y comodidad pensada para jornadas largas.",
        multiline: true,
      },
      { key: "tech1.title", label: "Punto 1 · título", value: "Aeroventilación" },
      {
        key: "tech1.body",
        label: "Punto 1 · texto",
        value: "Canales internos que evacúan calor sin sacrificar aerodinámica.",
        multiline: true,
      },
      { key: "tech2.title", label: "Punto 2 · título", value: "Listo para intercom" },
      {
        key: "tech2.body",
        label: "Punto 2 · texto",
        value:
          "Alojamientos internos para instalar tu sistema de comunicación.",
        multiline: true,
      },
      { key: "tech3.title", label: "Punto 3 · título", value: "Visera solar interna" },
      {
        key: "tech3.body",
        label: "Punto 3 · texto",
        value: "Despliegue rápido con un control lateral, incluso con guantes.",
        multiline: true,
      },
      {
        key: "tech4.title",
        label: "Punto 4 · título",
        value: "Certificación ECE 22.06",
      },
      {
        key: "tech4.body",
        label: "Punto 4 · texto",
        value:
          "Superamos el estándar europeo más exigente en absorción de impactos.",
        multiline: true,
      },
    ],
  },
  {
    id: "resenas",
    title: "Reseñas",
    description: "Encabezado de la sección de opiniones.",
    fields: [
      {
        key: "reviews.title",
        label: "Título",
        value: "4.8 / 5 en satisfacción",
      },
      {
        key: "reviews.subtitle",
        label: "Subtítulo",
        value: "Lo que dicen los pilotos que ya ruedan con ROVEX.",
        multiline: true,
      },
    ],
  },
  {
    id: "comunidad",
    title: "Comunidad",
    description: "La sección de fotos de clientes.",
    fields: [
      { key: "community.title", label: "Título", value: "Comunidad ROVEX" },
      {
        key: "community.subtitle",
        label: "Subtítulo",
        value: "Etiquétanos con #RuedaConRovex en tus rutas y aparece aquí.",
        multiline: true,
      },
    ],
  },
  {
    id: "newsletter",
    title: "Suscripción",
    description: "El bloque oscuro del final, para captar correos.",
    fields: [
      { key: "newsletter.eyebrow", label: "Etiqueta superior", value: "Únete al club" },
      {
        key: "newsletter.title",
        label: "Título",
        value: "10% en tu primera compra",
      },
      {
        key: "newsletter.body",
        label: "Descripción",
        value:
          "Suscríbete y recibe ofertas, lanzamientos y contenido para pilotos. Sin spam.",
        multiline: true,
      },
    ],
  },
  {
    id: "footer",
    title: "Pie de página",
    description: "El texto bajo el logo, en el pie.",
    fields: [
      {
        key: "footer.tagline",
        label: "Descripción de la marca",
        value:
          "Equipamiento, tecnología y estilo para motociclistas. Protección y diseño premium en cada kilómetro.",
        multiline: true,
      },
    ],
  },
];

/** Todos los campos en una lista plana. */
export const CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap(
  (g) => g.fields
);

/** Valores por defecto: los que se usan si la base de datos no tiene la clave. */
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f.value])
);

export type SiteContent = Record<string, string>;

/** Lee un texto con respaldo, para usar en los componentes. */
export function text(content: SiteContent, key: string): string {
  return content[key] ?? CONTENT_DEFAULTS[key] ?? "";
}

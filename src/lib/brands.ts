import type { Spec } from "./products";

/**
 * Marcas del catálogo y su plantilla de especificaciones.
 *
 * Cada plantilla trae ya escritos los datos que NO cambian entre modelos de
 * la misma marca (certificación, material de calota, tipo de interior, cierre
 * y los sistemas propietarios del fabricante). Los campos que sí cambian con
 * cada modelo —peso, ventilación, visor— quedan vacíos a propósito, con su
 * etiqueta puesta, para que solo haya que escribir el dato.
 *
 * De dónde salen los datos:
 *  - ICH, SHAFT y NEXX: de los productos ya cargados en esta tienda.
 *  - LS2 y HJC: de la ficha técnica de una referencia real en inducascos.com
 *    (LS2 FF808 Stream II y HJC F71).
 *  - NOLAN, AGV, HRO y X-ONE: de las descripciones de producto del mismo
 *    distribuidor.
 *
 * Conviene revisar el peso y la ventilación en cada modelo antes de publicar.
 */

export const BRANDS = [
  "ICH",
  "SHAFT",
  "NEXX",
  "LS2",
  "HJC",
  "NOLAN",
  "AGV",
  "HRO",
  "X-ONE",
] as const;

export type Brand = (typeof BRANDS)[number];

export const BRAND_SPECS: Record<Brand, Spec[]> = {
  ICH: [
    { label: "Peso", value: "" },
    { label: "Norma", value: "DOT" },
    { label: "Interior", value: "Cacheteras desmontables" },
    { label: "Sistema de retención", value: "Cierre micrométrico" },
    {
      label: "Ventilación",
      value:
        "Cámaras frontales superiores e inferiores y cámara trasera para la salida del aire",
    },
  ],

  SHAFT: [
    { label: "Peso", value: "" },
    { label: "Certificación", value: "ECE R22-06" },
    { label: "Visor interno", value: "Sí" },
    { label: "Interior", value: "Desmontable y lavable" },
    { label: "Antiempañante", value: "Preparado para Pinlock 70 Max Vision" },
    { label: "Cierre", value: "Cierre micrométrico" },
    { label: "Ventilación", value: "" },
    { label: "Intercomunicador", value: "Preparado para intercomunicador" },
  ],

  NEXX: [
    { label: "Tipo", value: "" },
    { label: "Certificación", value: "ECE 22-06, DOT FMVSS 218 y NBR-7471" },
    { label: "Peso", value: "" },
    { label: "Visor", value: "" },
    { label: "Forro", value: "Extraíble y lavable, antibacterial" },
    { label: "Ventilación", value: "" },
    { label: "Cierre", value: "Hebilla de regulación micrométrica" },
  ],

  // Ficha de referencia: LS2 FF808 Stream II.
  LS2: [
    { label: "Peso", value: "" },
    { label: "Certificación", value: "ECE R22-06" },
    { label: "Calota", value: "Policarbonato con microfibras de aramida (KPA)" },
    { label: "Interior", value: "Desmontable y lavable" },
    {
      label: "Acolchado",
      value: "Tapizado transpirable e hipoalergénico, cortado a láser",
    },
    { label: "Cierre", value: "Cierre micrométrico" },
    { label: "Ventilación", value: "" },
    { label: "Antiempañante", value: "Preparado para Pinlock 70 Max Vision" },
    { label: "Intercomunicador", value: "Preparado para intercomunicador" },
  ],

  // Ficha de referencia: HJC F71. La calota cambia por gama
  // (fibra de vidrio AFC, carbono en RPHA, policarbonato en gama de entrada).
  HJC: [
    { label: "Peso", value: "" },
    { label: "Certificación", value: "ECE R22-06" },
    { label: "Calota", value: "" },
    { label: "Interior", value: "Desmontable y lavable" },
    { label: "Cierre", value: "Cierre micrométrico" },
    { label: "Ventilación", value: "" },
    { label: "Antiempañante", value: "Preparado para Pinlock 70 Max Vision" },
    { label: "Intercomunicador", value: "Preparado para intercomunicador" },
  ],

  NOLAN: [
    { label: "Peso", value: "" },
    { label: "Certificación", value: "ECE R22-06" },
    { label: "Calota", value: "Policarbonato tipo LEXAN" },
    { label: "Origen", value: "Fabricado en Italia" },
    { label: "Interior", value: "Desmontable y lavable" },
    { label: "Cierre", value: "" },
    { label: "Ventilación", value: "" },
    { label: "Intercomunicador", value: "Preparado para sistema N-Com" },
  ],

  AGV: [
    { label: "Peso", value: "" },
    { label: "Certificación", value: "ECE 22-06" },
    {
      label: "Calota",
      value: "Termoplástico inyectado de alta resistencia (HIR-TH)",
    },
    { label: "Origen", value: "Fabricado en Italia" },
    {
      label: "Interior",
      value: "Desmontable y lavable, tejido 2DRY de absorción rápida",
    },
    { label: "Cierre", value: "" },
    { label: "Ventilación", value: "" },
  ],

  HRO: [
    { label: "Peso", value: "" },
    { label: "Norma", value: "DOT FMVSS 218" },
    { label: "Calota", value: "ABS termoplástico de alta resistencia" },
    { label: "Interior", value: "Acolchado desmontable" },
    { label: "Cierre", value: "" },
    { label: "Visor", value: "" },
    { label: "Ventilación", value: "" },
  ],

  "X-ONE": [
    { label: "Peso", value: "" },
    { label: "Norma", value: "DOT FMVSS 218" },
    { label: "Calota", value: "ABS de alta densidad" },
    {
      label: "Homologación",
      value: "Homologado en Colombia (Resolución 1080 de 2019)",
    },
    { label: "Interior", value: "Acolchado desmontable" },
    { label: "Cierre", value: "Hebilla micrométrica de ajuste rápido" },
    { label: "Visor", value: "Con seguro tipo snap" },
    { label: "Ventilación", value: "" },
  ],
};

/** Copia profunda: cada producto edita su propia plantilla, no la compartida. */
export function specsForBrand(brand: string): Spec[] {
  const template = BRAND_SPECS[brand as Brand];
  return template ? template.map((s) => ({ ...s })) : [];
}

/**
 * ¿Estas specs siguen siendo una plantilla sin tocar? Sirve para no pisar
 * datos que el administrador ya escribió cuando cambia de marca.
 */
export function isUntouchedTemplate(specs: Spec[]): boolean {
  if (specs.length === 0) return true;
  const same = (a: Spec[], b: Spec[]) =>
    a.length === b.length &&
    a.every((s, i) => s.label === b[i].label && s.value === b[i].value);
  return BRANDS.some((b) => same(specs, BRAND_SPECS[b]));
}

import AdminHeader from "@/components/admin/AdminHeader";
import OrdersManager, { type OrderRow } from "@/components/admin/OrdersManager";
import { ESTADOS_FILTRO, type EstadoFiltro, type Filtros, type Periodo } from "@/lib/pedidos";
import { inicioDia, inicioUltimosDias, mesActual, rangoMes } from "@/lib/fechas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Tope por consulta: un mes normal cabe de sobra; si no, se avisa en pantalla. */
const LIMITE = 500;

const PERIODOS: Periodo[] = ["mes", "hoy", "7d", "rango", "todo"];

function uno(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** Lee y valida los filtros de la URL; lo que no sea válido cae al valor por defecto. */
function leerFiltros(sp: Record<string, string | string[] | undefined>): Filtros {
  const estado = uno(sp.estado) as EstadoFiltro;
  const periodo = uno(sp.periodo) as Periodo;
  const mes = uno(sp.mes);
  const desde = uno(sp.desde);
  const hasta = uno(sp.hasta);
  const esDia = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  return {
    estado: estado in ESTADOS_FILTRO ? estado : "todos",
    periodo: PERIODOS.includes(periodo) ? periodo : "mes",
    mes: /^\d{4}-\d{2}$/.test(mes) ? mes : mesActual(),
    desde: esDia(desde) ? desde : "",
    hasta: esDia(hasta) ? hasta : "",
    q: uno(sp.q).slice(0, 80),
  };
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = leerFiltros(await searchParams);
  const supabase = await createClient();

  let consulta = supabase
    .from("orders")
    .select(
      "id,code,customer_name,customer_phone,customer_city,status,total,stock_applied,created_at,note,order_items(product_name,size,qty,unit_price)"
    )
    .order("created_at", { ascending: false })
    .limit(LIMITE);

  // Periodo, en hora de Colombia.
  if (filtros.periodo === "mes") {
    const { desde, hasta } = rangoMes(filtros.mes);
    consulta = consulta.gte("created_at", desde).lt("created_at", hasta);
  } else if (filtros.periodo === "hoy") {
    consulta = consulta.gte("created_at", inicioUltimosDias(1));
  } else if (filtros.periodo === "7d") {
    consulta = consulta.gte("created_at", inicioUltimosDias(7));
  } else if (filtros.periodo === "rango") {
    if (filtros.desde) consulta = consulta.gte("created_at", inicioDia(filtros.desde));
    if (filtros.hasta) consulta = consulta.lt("created_at", inicioDia(filtros.hasta, true));
  }

  const estados = ESTADOS_FILTRO[filtros.estado].estados;
  if (estados) consulta = consulta.in("status", estados);

  // Búsqueda: "#123" o "123" busca por número de pedido; lo demás por nombre,
  // ciudad o teléfono. Se quitan los caracteres que rompen el filtro .or().
  if (filtros.q) {
    const numero = filtros.q.match(/^#?(\d{1,9})$/)?.[1];
    if (numero) {
      consulta = consulta.eq("code", Number(numero));
    } else {
      const t = filtros.q.replace(/[,()*%\\]/g, " ").trim();
      if (t) {
        consulta = consulta.or(
          `customer_name.ilike.%${t}%,customer_city.ilike.%${t}%,customer_phone.ilike.%${t}%`
        );
      }
    }
  }

  // Pendientes de cualquier fecha: que un pedido viejo sin atender no quede
  // escondido por estar mirando otro mes.
  const [{ data }, { count: pendientesTotal }] = await Promise.all([
    consulta,
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
  ]);

  const pedidos = (data ?? []) as OrderRow[];

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Pedidos</h1>
          <p className="text-sm text-text-dark/55">
            Los pedidos llegan como “pendientes”. Al aprobarlos se descuenta el
            inventario; al rechazarlos o cancelarlos, vuelve.
          </p>
        </div>
        <OrdersManager
          orders={pedidos}
          filtros={filtros}
          mesActual={mesActual()}
          pendientesTotal={pendientesTotal ?? 0}
          truncado={pedidos.length === LIMITE}
        />
      </div>
    </>
  );
}

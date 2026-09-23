import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { WHATSAPP_NUMBER, STORE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de privacidad · ROVEX",
  description:
    "Cómo Cascorovex recopila, usa y protege tus datos personales al comprar en ROVEX o escribirnos por WhatsApp.",
};

/** WHATSAPP_NUMBER con espacios para lectura ("573126625966" -> "+57 312 662 5966"). */
const WHATSAPP_DISPLAY = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`;

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Quiénes somos",
    body: (
      <p>
        {STORE_NAME} es la tienda de cascos y equipamiento para motociclistas
        operada por Cascorovex (Bello, Antioquia, Colombia). Esta política
        aplica al sitio <strong>cascorovex.com</strong> y a las conversaciones
        que tengas con nuestro número de WhatsApp,{" "}
        <strong>{WHATSAPP_DISPLAY}</strong>.
      </p>
    ),
  },
  {
    title: "Qué datos recopilamos",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Datos de pedido:</strong> lo que nos compartes al finalizar
          una compra por WhatsApp — nombre, teléfono, ciudad, dirección de
          envío y los productos elegidos.
        </li>
        <li>
          <strong>Conversaciones de WhatsApp:</strong> los mensajes que nos
          escribes quedan registrados para poder atenderte, tanto si te
          responde nuestro equipo como si te responde el asesor virtual.
        </li>
        <li>
          <strong>Datos de navegación:</strong> qué páginas visitas y en qué
          botones haces clic, recogidos con el Píxel de Meta, para medir si
          nuestros anuncios funcionan.
        </li>
      </ul>
    ),
  },
  {
    title: "Para qué los usamos",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Procesar y coordinar la entrega de tu pedido.</li>
        <li>
          Responder tus preguntas sobre productos, tallas, envíos o garantía.
        </li>
        <li>
          Medir el rendimiento de nuestros anuncios en Meta (Facebook e
          Instagram) y mostrarlos a personas con intereses similares a los de
          nuestros clientes.
        </li>
        <li>Cumplir obligaciones legales y contables.</li>
      </ul>
    ),
  },
  {
    title: "Con quién los compartimos",
    body: (
      <>
        <p>
          No vendemos tus datos. Los compartimos únicamente con los
          proveedores que necesitamos para operar la tienda:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Meta</strong> (WhatsApp Business Platform y Meta Pixel),
            para recibir y responder tus mensajes y para medir anuncios.
          </li>
          <li>
            <strong>Supabase</strong>, donde se almacena la base de datos de
            pedidos y conversaciones.
          </li>
          <li>
            <strong>Anthropic</strong>, cuyo modelo de IA (Claude) redacta las
            respuestas del asesor virtual a partir del mensaje que escribes.
          </li>
          <li>
            <strong>Vercel</strong>, que aloja el sitio web.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Tus derechos",
    body: (
      <p>
        Como titular de tus datos personales, tienes derecho a conocer,
        actualizar, rectificar y solicitar la eliminación de tu información,
        conforme a la Ley 1581 de 2012 de Colombia. Para ejercer cualquiera de
        estos derechos, escríbenos por WhatsApp al{" "}
        <strong>{WHATSAPP_DISPLAY}</strong> indicando qué necesitas.
      </p>
    ),
  },
  {
    title: "Cambios a esta política",
    body: (
      <p>
        Si actualizamos esta política, la nueva versión quedará publicada en
        esta misma página con la fecha de la última actualización.
      </p>
    ),
  },
];

export default function PoliticaPrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
      <Reveal className="mb-10 text-center">
        <p className="eyebrow mb-2 text-accent">ROVEX · Legal</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Política de privacidad
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-text-dark/60">
          Última actualización: septiembre de 2026.
        </p>
      </Reveal>

      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <Reveal key={s.title} as="section">
            <h2 className="mb-3 font-display text-lg font-bold">{s.title}</h2>
            <div className="max-w-prose text-text-dark/75 leading-relaxed">
              {s.body}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

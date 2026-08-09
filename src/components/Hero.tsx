"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Cta from "./Cta";

declare global {
  interface Window {
    YT?: {
      Player: new (el: Element, opts: Record<string, unknown>) => {
        destroy: () => void;
        getIframe: () => HTMLIFrameElement;
      };
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VIDEO_ID = "5yZmy004TGw";
const EASE = [0.16, 1, 0.3, 1] as const;

const HEADLINE = ["Protección", "que", "se", "siente", "premium."];
const ACCENT_INDEX = HEADLINE.length - 1;

const TRUST = [
  { num: "4.8/5", label: "Valoración de pilotos" },
  { num: "+4.800", label: "Motociclistas en Colombia" },
  { num: "ECE 22.06", label: "Certificación homologada" },
  { num: "1-3 días", label: "Envío a todo el país" },
];

/**
 * Hero a pantalla completa con video de fondo (YouTube, autoplay/mute/loop).
 * Texto revelado palabra a palabra al cargar, layout de dos columnas
 * (titular a la izquierda, propuesta de valor + CTAs a la derecha) y una
 * fila de cifras de confianza abajo. El nav flotante se vuelve transparente
 * justo sobre este bloque (ver Nav.tsx).
 *
 * El video se monta con la API oficial de YouTube (no un <iframe> con src
 * directo) y se mantiene oculto hasta que la API confirma el evento
 * "reproduciendo": si el navegador bloquea el autoplay, YouTube muestra un
 * overlay central de pausa/siguiente que no se puede ocultar por parámetros
 * de URL — mantenerlo invisible hasta ese evento evita que se vea nunca.
 * Mientras tanto (o si el autoplay nunca arranca) se ve el resplandor de
 * respaldo. Bajo prefers-reduced-motion el video no se carga en absoluto.
 */
export default function Hero() {
  const reduce = useReducedMotion();
  const [showVideo, setShowVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (reduce) return;
    const id = requestAnimationFrame(() => setShowVideo(true));
    return () => cancelAnimationFrame(id);
  }, [reduce]);

  useEffect(() => {
    if (!showVideo || reduce || !mountRef.current) return;

    function createPlayer() {
      if (!mountRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        host: "https://www.youtube-nocookie.com",
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          // Sin loop/playlist: ese modo hace que YouTube RECARGUE el video en
          // cada vuelta (se ve un salto/parpadeo). El bucle se hace a mano en
          // onStateChange con seekTo(0), que es instantáneo y continuo.
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: { target: { getIframe: () => HTMLIFrameElement } }) => {
            e.target
              .getIframe()
              .setAttribute("title", "VELTOR — motociclistas en ruta");
          },
          onStateChange: (e: {
            data: number;
            target: { seekTo: (s: number, allow: boolean) => void; playVideo: () => void };
          }) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            // Bucle continuo: al terminar, rebobina y sigue sin recargar.
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0, true);
              e.target.playVideo();
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [showVideo, reduce]);

  const delayFor = (base: number) => (reduce ? 0 : base);

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-ink text-text-light">
      {/* Capa de fondo: resplandor de respaldo siempre presente + video, que se
          desvanece encima solo cuando confirma que ya está reproduciendo. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="ambient-glow absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute right-[-10%] top-[-10%] h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

        {showVideo && !reduce && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 [&>iframe]:pointer-events-none [&>iframe]:absolute [&>iframe]:left-1/2 [&>iframe]:top-1/2 [&>iframe]:h-[56.25vw] [&>iframe]:min-h-full [&>iframe]:w-[177.78vh] [&>iframe]:min-w-full [&>iframe]:-translate-x-1/2 [&>iframe]:-translate-y-1/2 [&>iframe]:scale-[1.04] ${
              playing ? "opacity-100" : "opacity-0"
            }`}
          >
            <div ref={mountRef} />
          </div>
        )}

        {/* Capa translúcida negra uniforme: asegura contraste del texto sobre cualquier fotograma del video. */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/40 to-ink/90" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 pb-12 pt-28 lg:gap-14 lg:px-8 lg:pb-16 lg:pt-32">
        {/* Eyebrow */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: delayFor(0) }}
          className="eyebrow inline-flex w-fit items-center gap-2 text-accent"
        >
          <span className="relative flex h-1.5 w-1.5">
            {!reduce && (
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-accent"
                animate={{ opacity: [0.9, 0.2, 0.9] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Envíos a toda Colombia
        </motion.p>

        {/* Fila media: titular a la izquierda, propuesta + CTAs a la derecha */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <h1 className="flex flex-wrap gap-x-[0.28em] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {HEADLINE.map((word, i) => (
                <span key={word} className="overflow-hidden pb-1">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.7,
                      ease: EASE,
                      delay: delayFor(0.18 + i * 0.045),
                    }}
                  >
                    <span className={i === ACCENT_INDEX ? "text-accent" : undefined}>
                      {word}
                    </span>
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: delayFor(0.5) }}
              className="mt-6 max-w-md text-lg text-text-light/70"
            >
              Cascos, guantes y tecnología para motociclistas que no negocian
              seguridad ni estilo. Diseñado para la ruta colombiana.
            </motion.p>
          </div>

          <div className="flex max-w-sm flex-col items-start gap-5 lg:items-end lg:text-right">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: delayFor(0.58) }}
              className="hidden text-sm text-text-light/65 lg:block"
            >
              Equipamiento certificado bajo{" "}
              <strong className="font-semibold text-text-light">ECE 22.06</strong>,
              con materiales premium y acabados a la altura de cada kilómetro
              que recorres.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: delayFor(0.66) }}
              className="flex flex-wrap gap-3 lg:justify-end"
            >
              <Cta href="/#catalogo" variant="primary">
                Ver catálogo <ArrowRight size={16} />
              </Cta>
              <Cta
                href="/producto/shpro-609"
                variant="secondary"
                className="!border-white/25 !text-text-light hover:!border-white/60"
              >
                Producto destacado
              </Cta>
            </motion.div>
          </div>
        </div>

        {/* Fila inferior: cifras de confianza */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: delayFor(0.8) }}
          className="hidden flex-wrap justify-center gap-x-10 gap-y-4 border-t border-white/10 pt-8 lg:flex lg:justify-between"
        >
          {TRUST.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1 lg:items-start">
              <span className="font-display text-sm font-bold text-accent">{t.num}</span>
              <span className="text-xs text-text-light/60">{t.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

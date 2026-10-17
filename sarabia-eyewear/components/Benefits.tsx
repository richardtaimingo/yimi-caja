import { BadgeCheck, Ruler, Truck } from "lucide-react";
import { Reveal } from "./ui";

const benefits = [
  {
    icon: Truck,
    title: "Envíos rápidos",
    body: "Armazón solo o con micas neutras en 2 a 4 días hábiles. Graduados en 5 a 7. Envío gratis a todo México con guía de rastreo.",
  },
  {
    icon: Ruler,
    title: "Garantía de ajuste",
    body: "Si no te quedan perfecto, los ajustamos o cambiamos sin costo durante 30 días. Ajustes en tienda gratis de por vida.",
  },
  {
    icon: BadgeCheck,
    title: "Micas certificadas",
    body: "Micas de laboratorio con protección UV400 y tratamientos verificados. Rehacemos tus micas si tu graduación no se siente bien.",
  },
];

export function Benefits() {
  return (
    <section aria-label="Beneficios" className="border-b border-paper/10 py-16 md:py-20">
      <div className="container grid gap-4 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.08} className="rounded-3xl bg-night-2 p-7 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-volt/15 text-volt-ice ring-1 ring-volt/40">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-display text-sm uppercase tracking-[0.08em]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-paper/55">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

import { Star } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

// Contenido de ejemplo: reemplazar por reseñas reales (Google, Instagram) antes de publicar.
const reviews = [
  { name: "Mariana G.", city: "CDMX", model: "Valeria · Verde Bosque", text: "Por fin unos lentes que se ven caros sin costar una fortuna. Las micas llegaron perfectas con mi graduación." },
  { name: "Diego R.", city: "Guadalajara", model: "Costa · Carey / G-15", text: "Los polarizados son otro nivel. Manejar en carretera ya no me cansa la vista." },
  { name: "Sofía L.", city: "Monterrey", model: "Mateo · Carey Habana", text: "Ligerísimos. Trabajo 9 horas frente a la compu con Blue Block y se nota la diferencia." },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Reseñas" title="Lo dicen mejor ellos." />
          <Reveal className="flex items-center gap-3">
            <span className="text-5xl font-semibold tracking-tightest">4.9</span>
            <div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-paper" />)}
              </div>
              <p className="text-sm text-paper/55">Calificación promedio de clientes</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.08} className="flex flex-col rounded-3xl border border-paper/10 bg-night-2 p-7 shadow-card">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-sun text-sun" />)}
              </div>
              <blockquote className="mt-5 flex-1 text-lg leading-snug tracking-tight">“{r.text}”</blockquote>
              <footer className="mt-6 flex items-center justify-between border-t border-paper/10 pt-5 text-sm">
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="text-paper/55">{r.city}</span>
                </span>
                <span className="rounded-full bg-night-2 px-3 py-1 text-xs font-medium">{r.model}</span>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

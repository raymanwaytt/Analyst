import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"

export function Button({
  kind = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "ghost" | "ink" }) {
  const look =
    kind === "primary"
      ? "bg-gradient-to-r from-indigo-800 to-violet-800 text-white shadow-lift hover:from-indigo-950 hover:to-violet-950"
      : kind === "ink"
        ? "bg-night text-white hover:bg-indigo-950"
        : "border border-indigo-200 bg-white text-ink hover:border-indigo-400 hover:bg-indigo-50"
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 ${look} ${className}`}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  )
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-indigo-100 bg-white px-3 py-2 text-base leading-6 text-ink shadow-sm placeholder:text-slate-500 focus:border-indigo-400 ${className}`}
    />
  )
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`motion-safe:animate-rise rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {children}
    </section>
  )
}

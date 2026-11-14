import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"

export function Button({
  kind = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "ghost" | "ink" }) {
  const look =
    kind === "primary"
      ? "bg-rust text-paper hover:bg-[#742c14]"
      : kind === "ink"
        ? "bg-ink text-paper hover:bg-black"
        : "border border-line bg-card text-ink hover:bg-paper"
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${look} ${className}`}
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
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  )
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-line bg-card px-3 py-2 text-base leading-6 text-ink placeholder:text-[#8a8175] ${className}`}
    />
  )
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-card p-4 shadow-card ${className}`}>{children}</section>
}

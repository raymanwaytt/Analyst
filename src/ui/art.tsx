import type { ReactNode } from "react"
import type { Theme } from "../domain/types"

type SceneKey = "airline" | "telco" | "fintech" | "ops" | "growth" | "shop" | "music" | "mixed"

export function sceneKey(industry: string, theme: Theme): SceneKey {
  const text = industry.toLowerCase()
  if (text.includes("air")) return "airline"
  if (text.includes("telecom") || text.includes("telco")) return "telco"
  if (text.includes("music") || text.includes("stream")) return "music"
  if (text.includes("retail") || text.includes("commerce") || text.includes("shop")) return "shop"
  if (text.includes("lend") || text.includes("bank") || text.includes("credit") || theme === "fintech-credit") return "fintech"
  if (theme === "growth-marketing") return "growth"
  if (theme === "ops") return "ops"
  return "mixed"
}

const FRAME: Record<SceneKey, string> = {
  airline: "from-sky-200 via-indigo-100 to-white",
  telco: "from-lime-200 via-teal-100 to-white",
  fintech: "from-amber-200 via-orange-100 to-white",
  ops: "from-teal-200 via-cyan-100 to-white",
  growth: "from-fuchsia-200 via-violet-100 to-white",
  shop: "from-rose-200 via-amber-100 to-white",
  music: "from-violet-200 via-pink-100 to-white",
  mixed: "from-indigo-200 via-teal-100 to-white",
}

export function Scene({ industry, theme, className = "h-28 w-36" }: { industry: string; theme: Theme; className?: string }) {
  const key = sceneKey(industry, theme)
  return (
    <div className={`art-float relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${FRAME[key]} ${className}`} aria-hidden="true">
      <SceneSvg kind={key} />
    </div>
  )
}

export function EmptyLogArt() {
  return (
    <div className="art-float mx-auto h-32 w-40" aria-hidden="true">
      <SceneSvg kind="mixed" />
    </div>
  )
}

export function EmptyBankArt() {
  return (
    <div className="art-float mx-auto h-28 w-36" aria-hidden="true">
      <SceneSvg kind="ops" />
    </div>
  )
}

export function HeroMark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="prior-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#e879f9" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#prior-mark)" />
      <rect x="14" y="36" width="8" height="14" rx="2" fill="#fff" />
      <rect x="26" y="26" width="8" height="24" rx="2" fill="#fde68a" />
      <rect x="38" y="16" width="8" height="34" rx="2" fill="#fff" />
      <circle cx="50" cy="18" r="5" fill="#fde68a" />
    </svg>
  )
}

function SceneSvg({ kind }: { kind: SceneKey }) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full">
      {kind === "airline" ? <Airline /> : null}
      {kind === "telco" ? <Telco /> : null}
      {kind === "fintech" ? <Fintech /> : null}
      {kind === "ops" ? <Ops /> : null}
      {kind === "growth" ? <Growth /> : null}
      {kind === "shop" ? <Shop /> : null}
      {kind === "music" ? <Music /> : null}
      {kind === "mixed" ? <Mixed /> : null}
    </svg>
  )
}

function Airline() {
  return (
    <>
      <ellipse cx="80" cy="92" rx="52" ry="8" fill="#0ea5e9" opacity="0.25" />
      <path d="M18 78c28-8 46-8 70 0" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 70l78-16 10 8-70 18z" fill="#1e1b4b" />
      <path d="M62 64l14 18 22-6-8-16z" fill="#6366f1" />
      <path d="M108 52l16 4-10 8z" fill="#f472b6" />
      <circle cx="124" cy="28" r="10" fill="#fde68a" />
    </>
  )
}

function Telco() {
  return (
    <>
      <rect x="70" y="46" width="10" height="52" rx="3" fill="#134e4a" />
      <path d="M75 46c-18 8-28 22-28 38" fill="none" stroke="#65a30d" strokeWidth="4" strokeLinecap="round" />
      <path d="M75 46c18 8 28 22 28 38" fill="none" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
      <path d="M75 34c-28 10-42 30-42 52" fill="none" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M75 34c28 10 42 30 42 52" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <circle cx="75" cy="28" r="8" fill="#facc15" />
    </>
  )
}

function Fintech() {
  return (
    <>
      <rect x="28" y="34" width="78" height="50" rx="10" fill="#1e1b4b" />
      <rect x="28" y="46" width="78" height="10" fill="#f59e0b" />
      <rect x="40" y="64" width="28" height="8" rx="2" fill="#c4b5fd" />
      <circle cx="112" cy="40" r="18" fill="#fbbf24" />
      <circle cx="112" cy="40" r="10" fill="#fff7ed" />
      <path d="M112 32v16M106 38h12" stroke="#9a3412" strokeWidth="2" />
    </>
  )
}

function Ops() {
  return (
    <>
      <rect x="24" y="58" width="112" height="36" rx="8" fill="#134e4a" />
      <rect x="36" y="40" width="22" height="28" rx="4" fill="#5eead4" />
      <rect x="66" y="28" width="22" height="40" rx="4" fill="#fde68a" />
      <rect x="96" y="46" width="22" height="22" rx="4" fill="#fb7185" />
      <circle cx="46" cy="78" r="6" fill="#fff" />
      <circle cx="114" cy="78" r="6" fill="#fff" />
    </>
  )
}

function Growth() {
  return (
    <>
      <path d="M24 92h112" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
      <rect x="36" y="68" width="16" height="24" rx="4" fill="#c4b5fd" />
      <rect x="60" y="52" width="16" height="40" rx="4" fill="#a78bfa" />
      <rect x="84" y="36" width="16" height="56" rx="4" fill="#e879f9" />
      <path d="M40 58l28-22 18 10 24-28" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="112" cy="18" r="7" fill="#facc15" />
    </>
  )
}

function Shop() {
  return (
    <>
      <path d="M36 48h88l-8 44H44z" fill="#9f1239" />
      <path d="M48 48c0-16 12-26 32-26s32 10 32 26" fill="none" stroke="#1e1b4b" strokeWidth="4" />
      <circle cx="64" cy="70" r="6" fill="#fecdd3" />
      <circle cx="96" cy="70" r="6" fill="#fde68a" />
      <rect x="58" y="84" width="44" height="6" rx="3" fill="#fff1f2" />
    </>
  )
}

function Music() {
  return (
    <>
      <circle cx="58" cy="86" r="16" fill="#4c1d95" />
      <circle cx="108" cy="74" r="16" fill="#db2777" />
      <rect x="70" y="28" width="6" height="58" fill="#1e1b4b" />
      <rect x="120" y="22" width="6" height="52" fill="#1e1b4b" />
      <path d="M76 28c22-8 36-6 44-2v10c-10-4-24-6-44 2z" fill="#facc15" />
    </>
  )
}

function Mixed() {
  return (
    <>
      <circle cx="80" cy="60" r="34" fill="#312e81" />
      <circle cx="80" cy="60" r="8" fill="#fde68a" />
      <path d="M80 26v12M80 82v12M46 60h12M102 60h12" stroke="#5eead4" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 36l8 8M96 76l8 8M104 36l-8 8M64 76l-8 8" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

export function NavIcon({ name }: { name: "today" | "log" | "stats" | "library" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      {name === "today" ? <path {...common} d="M5 6h14v13H5zM8 4v4M16 4v4M5 10h14" /> : null}
      {name === "log" ? <path {...common} d="M7 4h8l4 4v12H7zM15 4v4h4M9 12h6M9 16h4" /> : null}
      {name === "stats" ? <path {...common} d="M5 19V9M12 19V5M19 19v-7" /> : null}
      {name === "library" ? <path {...common} d="M5 19V6l7-2 7 2v13M5 19l7 2 7-2M12 4v17" /> : null}
    </svg>
  )
}

export function Celebration({ children }: { children: ReactNode }) {
  const bits = [
    ["-42px", "-28px", "#facc15"],
    ["38px", "-32px", "#f472b6"],
    ["-28px", "18px", "#2dd4bf"],
    ["46px", "12px", "#818cf8"],
    ["0px", "-40px", "#fb7185"],
    ["-8px", "26px", "#fbbf24"],
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-800 via-fuchsia-800 to-teal-800 px-4 py-4 text-white shadow-lift">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {bits.map(([x, y, color], index) => (
          <span
            key={color}
            className="confetti absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full"
            style={{ background: color, ["--x" as string]: x, ["--y" as string]: y, animationDelay: `${index * 40}ms` }}
          />
        ))}
      </div>
      <p className="relative text-sm font-semibold">{children}</p>
    </div>
  )
}

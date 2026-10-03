import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const runtime = "nodejs"

export const alt = "GazPoint - Trouve ton gaz avant de te déplacer"

export const size = { width: 1200, height: 1200 }

export const contentType = "image/png"

const INK = "#010101"
const NAVY = "#19398D"
const MUTED = "#454545"
const BORDER = "#E3E3E3"
const PAPER = "#F5F5F2"

const REASSURANCES = ["Gratuit", "Sans abonnement", "Sans carte bancaire"]

function CheckIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={NAVY}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default async function OpengraphImageMobile() {
  const fonts = [
    {
      name: "Inter",
      data: readFileSync(join(process.cwd(), "fonts/inter-400.ttf")),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: readFileSync(join(process.cwd(), "fonts/inter-700.ttf")),
      weight: 700 as const,
      style: "normal" as const,
    },
  ]

  const logo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public/brand/logo.png")
  ).toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#F3F5FB",
          fontFamily: "Inter",
          padding: 80,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -200,
            width: 600,
            height: 600,
            borderRadius: 9999,
            backgroundColor: "rgba(25, 57, 141, 0.06)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              backgroundColor: PAPER,
              border: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={logo} alt="" width={64} height={64} />
          </div>
          <span style={{ fontSize: 44, fontWeight: 700, color: INK, letterSpacing: -1 }}>
            GazPoint
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", textAlign: "center" }}>
          <div style={{ marginBottom: 32 }}>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1.4,
                lineHeight: 1.15,
                color: INK,
              }}
            >
              Vérifie où il y en a
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: -1.4,
                lineHeight: 1.15,
                color: NAVY,
              }}
            >
              avant de te déplacer.
            </span>
          </div>

          <div
            style={{
              marginTop: 24,
              marginBottom: 48,
              fontSize: 28,
              lineHeight: 1.5,
              color: MUTED,
              maxWidth: 800,
            }}
          >
            Les points de vente de gaz près de chez toi, avec la
            disponibilité, la distance et le numéro du vendeur.
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {REASSURANCES.map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 28px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(25, 57, 141, 0.1)",
                }}
              >
                <CheckIcon />
                <span style={{ fontSize: 24, color: NAVY }}>{item}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 360,
              height: 360,
              borderRadius: 28,
              backgroundColor: PAPER,
              border: `1px solid ${BORDER}`,
            }}
          >
            <img src={logo} alt="" width={280} height={280} />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
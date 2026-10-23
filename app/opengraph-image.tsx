import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const runtime = "nodejs"

export const alt = "GazPoints, Vérifie où il y en a avant de te déplacer. Les points de vente de gaz près de chez toi, avec la disponibilité, la distance et le numéro du vendeur."

export const size = { width: 1200, height: 630 }

export const contentType = "image/png"

const INK = "#17251E"
const NAVY = "#174A7E"
const MUTED = "#5B6B62"
const BORDER = "#DFE8E2"
const PAPER = "#F5F7F6"

const REASSURANCES = ["Gratuit", "Sans abonnement", "Sans carte bancaire"]

function CheckIcon() {
  return (
    <svg
      width={16}
      height={16}
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

export default async function OpengraphImage() {
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
          backgroundColor: "#EFF4FA",
          fontFamily: "Inter",
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -150,
            bottom: -190,
            width: 580,
            height: 580,
            borderRadius: 9999,
            backgroundColor: "rgba(23, 74, 126, 0.06)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: PAPER,
              border: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={logo} alt="" width={44} height={44} />
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, color: INK, letterSpacing: -0.8 }}>
            GazPoints
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 56,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 696,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 700,
                  letterSpacing: -1.6,
                  lineHeight: 1.12,
                  color: INK,
                }}
              >
                Vérifie où il y en a
              </span>
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 700,
                  letterSpacing: -1.6,
                  lineHeight: 1.12,
                  color: NAVY,
                }}
              >
                avant de te déplacer.
              </span>
            </div>

            <div
              style={{
                marginTop: 24,
                fontSize: 26,
                lineHeight: 1.45,
                color: MUTED,
              }}
            >
              Les points de vente de gaz près de chez toi, avec la
              disponibilité, la distance et le numéro du vendeur.
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              {REASSURANCES.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 9999,
                    backgroundColor: "rgba(23, 74, 126, 0.1)",
                  }}
                >
                  <CheckIcon />
                  <span style={{ fontSize: 20, color: NAVY }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 320,
              height: 400,
              borderRadius: 24,
              backgroundColor: PAPER,
              border: `1px solid ${BORDER}`,
            }}
          >
            <img src={logo} alt="" width={260} height={260} />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
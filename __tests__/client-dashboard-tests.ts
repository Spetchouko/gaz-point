import assert from "node:assert/strict"
import {
  ClientRequestError,
  requestJson,
} from "@/lib/client-request"
import {
  buildReservationHistoryHref,
  buildSearchHistoryHref,
  getReservationStatusLabel,
  isInHistoryDateRange,
} from "@/lib/client-dashboard"
import { buildCsv, escapeCsvValue } from "@/lib/csv-export"
import { resolveDashboardAccess } from "@/lib/auth-routing"

const originalFetch = globalThis.fetch

function restoreFetch() {
  globalThis.fetch = originalFetch
}

async function testRequestJsonSuccess() {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ ok: true, value: 7 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  const result = await requestJson<{ ok: boolean; value: number }>("/test")
  assert.deepEqual(result, { ok: true, value: 7 })
}

async function testRequestJsonHttpError() {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

  await assert.rejects(
    requestJson("/test"),
    (error: unknown) => {
      assert.ok(error instanceof ClientRequestError)
      assert.equal(error.kind, "http")
      assert.equal(error.status, 401)
      assert.equal(error.message, "Non authentifié")
      return true
    }
  )
}

async function testRequestJsonTimeout() {
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal
      const rejectAsAborted = () => {
        const error = new Error("aborted")
        error.name = "AbortError"
        reject(error)
      }
      if (signal?.aborted) {
        rejectAsAborted()
        return
      }
      signal?.addEventListener("abort", rejectAsAborted, { once: true })
    })

  await assert.rejects(
    requestJson("/test", {}, { timeoutMs: 10 }),
    (error: unknown) => {
      assert.ok(error instanceof ClientRequestError)
      assert.equal(error.kind, "timeout")
      assert.equal(error.status, null)
      return true
    }
  )
}

async function testRequestJsonExternalAbort() {
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal
      const rejectAsAborted = () => {
        const error = new Error("aborted")
        error.name = "AbortError"
        reject(error)
      }
      if (signal?.aborted) {
        rejectAsAborted()
        return
      }
      signal?.addEventListener("abort", rejectAsAborted, { once: true })
    })

  const controller = new AbortController()
  const pending = requestJson("/test", { signal: controller.signal })
  controller.abort()

  await assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof ClientRequestError)
    assert.equal(error.kind, "aborted")
    return true
  })
}

function testHistoryHelpers() {
  const href = buildSearchHistoryHref({
    brand: "Total",
    format: "12,5 kg",
    zone: "Douala",
  })
  assert.equal(
    href,
    "/dashboard/recherches?brand=Total&format=12%2C5+kg&zone=Douala"
  )
  assert.equal(
    buildSearchHistoryHref({ brand: null, format: null, zone: null }),
    "/dashboard/recherches"
  )
  assert.equal(
    buildReservationHistoryHref("reservation-42"),
    "/dashboard/reservations?reservation=reservation-42"
  )
  assert.equal(getReservationStatusLabel("expired"), "Expirée")

  const now = new Date(2026, 10, 21, 12, 0, 0)
  assert.equal(
    isInHistoryDateRange(new Date(2026, 10, 21, 8, 0, 0), "today", now),
    true
  )
  assert.equal(
    isInHistoryDateRange(new Date(2026, 10, 20, 23, 0, 0), "today", now),
    false
  )
  assert.equal(
    isInHistoryDateRange(new Date(2026, 10, 16, 8, 0, 0), "week", now),
    true
  )
}

function testCsvExport() {
  assert.equal(escapeCsvValue('Nom "Test"'), '"Nom ""Test"""')
  assert.equal(escapeCsvValue("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"')
  assert.equal(
    buildCsv(["Code", "Montant"], [["GP123", 1000]]),
    '"Code","Montant"\r\n"GP123","1000"'
  )
}

function testClientDashboardRoutes() {
  const paths = [
    "/dashboard/client",
    "/dashboard/profil",
    "/dashboard/recherches",
    "/dashboard/reservations",
    "/dashboard/historique",
    "/dashboard/notifications",
  ]

  for (const path of paths) {
    assert.equal(resolveDashboardAccess(path, "client").allowed, true, path)
  }
}

async function main() {
  try {
    await testRequestJsonSuccess()
    await testRequestJsonHttpError()
    await testRequestJsonTimeout()
    await testRequestJsonExternalAbort()
    testHistoryHelpers()
    testCsvExport()
    testClientDashboardRoutes()
    console.log("✓ Client dashboard tests passed")
  } finally {
    restoreFetch()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

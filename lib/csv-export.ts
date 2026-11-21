export function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value)
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

export function buildCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[]
): string {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n")
}

export function downloadCsv(
  filename: string,
  csv: string,
  targetDocument: Document = document
): void {
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = targetDocument.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  targetDocument.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

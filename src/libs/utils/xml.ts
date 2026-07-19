export const escapeXml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

export const toAbsoluteUrl = (baseUrl: string, path = ""): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, "")
  const normalizedPath = path.replace(/^\/+/, "")

  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase
}

export const toIsoDate = (value: string): string | undefined => {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export const toRssDate = (value: string): string | undefined => {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString()
}

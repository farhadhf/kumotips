import { NotionAPI } from "notion-client"

type FetchOptions = Parameters<NotionAPI["fetch"]>[0]

const RECORD_MAP_TABLES = [
  "block",
  "collection",
  "collection_view",
  "notion_user",
] as const

const normalizeRecordMapResponse = (response: unknown) => {
  if (!response || typeof response !== "object") return

  const recordMap = (response as any).recordMap
  if (!recordMap || typeof recordMap !== "object") return

  for (const tableName of RECORD_MAP_TABLES) {
    const table = recordMap[tableName]
    if (!table || typeof table !== "object") continue

    for (const [id, entry] of Object.entries(table)) {
      const publicRecord = (entry as any)?.value

      // Notion's public API now wraps records as
      // { value: { role, value: record } }. notion-client 6.x expects the
      // inner { role, value: record } shape and otherwise passes a block
      // without an id to react-notion-x.
      if (
        publicRecord?.role &&
        publicRecord.value &&
        typeof publicRecord.value === "object"
      ) {
        table[id] = publicRecord
      }
    }
  }
}

class PublicNotionAPI extends NotionAPI {
  async fetch<T>(options: FetchOptions): Promise<T> {
    const response = await super.fetch<T>(options)
    normalizeRecordMapResponse(response)
    return response
  }
}

export const getRecordMap = async (pageId: string) => {
  const api = new PublicNotionAPI()
  const recordMap = await api.getPage(pageId)
  return recordMap
}

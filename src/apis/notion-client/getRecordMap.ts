import { NotionAPI } from "notion-client"

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI({
    apiBaseUrl: "https://prong-waterfall-12c.notion.site/api/v3"
  })
  const recordMap = await api.getPage(pageId)
  return recordMap
}

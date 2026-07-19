import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = (await api.getPageRaw(id)).recordMap
  id = idToUuid(id)
  const rootEntry = response.block[id]?.value as any
  const root = rootEntry?.value ?? rootEntry

  if (
    root?.type !== "collection_view_page" &&
    root?.type !== "collection_view"
  ) {
    return []
  }

  const collectionId = root.collection_id as string | undefined
  const viewId = root.view_ids?.[0] as string | undefined
  if (!collectionId || !viewId) return []

  const collectionEntry = response.collection?.[collectionId]?.value as any
  const collection = collectionEntry?.value ?? collectionEntry
  const viewEntry = response.collection_view?.[viewId]?.value as any
  const view = viewEntry?.value ?? viewEntry
  if (!collection?.schema || !view) return []

  // notion-client 6.x does not currently unwrap the nested public record-map
  // values before discovering collection views. Query the discovered view
  // explicitly so builds do not silently receive an empty collection_query.
  const collectionData = await api.getCollectionData(collectionId, viewId, view)
  const block = {
    ...response.block,
    ...(collectionData.recordMap?.block ?? {}),
  }
  const reducerResults = (collectionData.result as any)?.reducerResults
  const pageIds = reducerResults?.collection_group_results?.blockIds ?? []
  const data = []

  for (const pageId of pageIds) {
    const pageBlockEntry = block[pageId]?.value as any
    const pageBlock = pageBlockEntry?.value ?? pageBlockEntry
    if (!pageBlock) continue

    const properties = await getPageProperties(
      pageId,
      block,
      collection.schema
    )
    properties.createdTime = new Date(pageBlock.created_time).toString()
    properties.fullWidth = pageBlock.format?.page_full_width ?? false
    data.push(properties)
  }

  data.sort((a: any, b: any) => {
    const dateA: any = new Date(a?.date?.start_date || a.createdTime)
    const dateB: any = new Date(b?.date?.start_date || b.createdTime)
    return dateB - dateA
  })

  return data as TPosts
}

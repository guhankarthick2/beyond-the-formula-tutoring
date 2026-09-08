import type { AvailabilitySlot, Topic } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export type SlotTopicRow = {
  topic_id: string
  topics: Topic | null
}

/** Embedded select fragment for slot topic tags. */
export const SLOT_TOPICS_EMBED =
  'slot_topics(topic_id, topics!slot_topics_topic_id_fkey(id, name, slug, sort_order))'

function asTopic(raw: unknown): Topic | null {
  if (!raw) return null
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== 'object') return null
  const t = row as Partial<Topic>
  if (!t.id || !t.name) return null
  return {
    id: t.id,
    name: t.name,
    slug: t.slug ?? '',
    youtube_url: t.youtube_url ?? null,
    sort_order: t.sort_order ?? 0,
    active: t.active ?? true,
  }
}

export function slotTopicNames(slot: Pick<AvailabilitySlot, 'slot_topics'> | null | undefined): string[] {
  const rows = slot?.slot_topics ?? []
  return rows
    .map((r) => asTopic(r.topics))
    .filter((t): t is Topic => Boolean(t))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((t) => t.name)
}

export function formatSlotTopics(
  slot: Pick<AvailabilitySlot, 'slot_topics'> | null | undefined,
  emptyLabel = 'Any topic',
): string {
  const names = slotTopicNames(slot)
  return names.length ? names.join(', ') : emptyLabel
}

export function slotHasTopic(
  slot: Pick<AvailabilitySlot, 'slot_topics'> | null | undefined,
  topicId: string,
): boolean {
  return (slot?.slot_topics ?? []).some((r) => r.topic_id === topicId)
}

/** Replace all topic tags on a slot. Empty array = Any topic. */
export async function replaceSlotTopics(
  slotId: string,
  topicIds: string[],
): Promise<{ error: string | null }> {
  const { error: delErr } = await supabase.from('slot_topics').delete().eq('slot_id', slotId)
  if (delErr) return { error: delErr.message }

  const unique = Array.from(new Set(topicIds.filter(Boolean)))
  if (unique.length === 0) return { error: null }

  const { error: insErr } = await supabase.from('slot_topics').insert(
    unique.map((topic_id) => ({ slot_id: slotId, topic_id })),
  )
  return { error: insErr?.message ?? null }
}

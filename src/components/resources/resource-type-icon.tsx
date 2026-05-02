import { FileText, Link2, Video } from 'lucide-react'

const TYPE_META: Record<string, { Icon: typeof FileText; label: string; color: string }> = {
  FILE: { Icon: FileText, label: 'File', color: 'bg-cyan' },
  VIDEO: { Icon: Video, label: 'Video', color: 'bg-coral' },
  LINK: { Icon: Link2, label: 'Link', color: 'bg-lime' },
}

export function getResourceTypeMeta(type: string) {
  return TYPE_META[type] || TYPE_META.LINK
}

export function ResourceTypeBadge({ type }: { type: string }) {
  const { Icon, label, color } = getResourceTypeMeta(type)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${color} border border-black text-[10px] font-bold uppercase`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

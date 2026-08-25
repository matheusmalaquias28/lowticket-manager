'use client'

import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskLink } from '@/lib/types'

interface LinksListProps {
  links: TaskLink[]
  onChange: (links: TaskLink[]) => void
}

export function LinksList({ links, onChange }: LinksListProps) {
  function addLink() {
    onChange([...links, { label: '', url: '' }])
  }

  function update(idx: number, field: 'label' | 'url', value: string) {
    onChange(links.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function remove(idx: number) {
    onChange(links.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      {links.map((link, idx) => (
        <div
          key={idx}
          className={cn(
            'group relative flex items-center gap-2 p-2 rounded-lg transition-colors',
            link.url ? 'hover:bg-[#1A1A24] cursor-pointer' : 'hover:bg-[#1A1A24]'
          )}
          onClick={() => link.url && window.open(link.url, '_blank', 'noopener,noreferrer')}
        >
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="text"
              value={link.label}
              onChange={e => update(idx, 'label', e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Rótulo do link"
              className="bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#5A5A70] focus:outline-none cursor-text"
            />
            <input
              type="url"
              value={link.url}
              onChange={e => update(idx, 'url', e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="https://..."
              className="bg-transparent text-[10px] text-[#5A5A70] placeholder:text-[#5A5A70] focus:outline-none cursor-text"
            />
          </div>
          {link.url && (
            <ExternalLink
              size={12}
              className="text-[#5A5A70] group-hover:text-[#8B5CF6] transition-colors shrink-0"
            />
          )}
          <button
            onClick={e => { e.stopPropagation(); remove(idx) }}
            className="opacity-0 group-hover:opacity-100 text-[#5A5A70] hover:text-[#EF4444] transition-all shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={addLink}
        className="flex items-center gap-1.5 text-xs text-[#5A5A70] hover:text-[#8B5CF6] transition-colors py-1"
      >
        <Plus size={14} />
        Adicionar link
      </button>
    </div>
  )
}

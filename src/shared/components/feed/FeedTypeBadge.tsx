'use client'

import { BarChart3, FileText, HelpCircle, PenLine } from 'lucide-react'

import type { FeedItem } from '@/shared/types/profile'
import { Badge } from '@/ui/widgets/badge'
import { cn } from '@/lib/utils'

interface FeedTypeBadgeProps {
  type: FeedItem['type']
}

const typeConfig = {
  post: { label: 'Пост', Icon: PenLine, colorClass: 'text-blue-600' },
  poll: { label: 'Опрос', Icon: BarChart3, colorClass: 'text-orange-500' },
  quiz: { label: 'Викторина', Icon: HelpCircle, colorClass: 'text-violet-500' },
  article: { label: 'Статья', Icon: FileText, colorClass: 'text-emerald-600' },
} satisfies Record<
  FeedItem['type'],
  { label: string; Icon: typeof PenLine; colorClass: string }
>

export const FeedTypeBadge = ({ type }: FeedTypeBadgeProps) => {
  const { label, Icon, colorClass } = typeConfig[type]

  return (
    <Badge
      variant="secondary"
      className="h-6 w-6 justify-center rounded-full p-0"
      aria-label={label}
      title={label}
    >
      <Icon className={cn('h-3.5 w-3.5', colorClass)} />
      <span className="sr-only">{label}</span>
    </Badge>
  )
}

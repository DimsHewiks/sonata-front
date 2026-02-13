'use client'

import type { RefObject } from 'react'
import { BarChart3, FileText, HelpCircle, PenLine } from 'lucide-react'

import type { ComposerType } from '@/screens/profile/profile-components.types'
import type { FeedItem } from '@/shared/types/profile'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/widgets/tabs'
import { ComposerArticleForm } from '@/screens/profile/components/composer/ComposerArticleForm'
import { ComposerPollForm } from '@/screens/profile/components/composer/ComposerPollForm'
import { ComposerPostForm } from '@/screens/profile/components/composer/ComposerPostForm'
import { ComposerQuizForm } from '@/screens/profile/components/composer/ComposerQuizForm'

interface ProfileComposerProps {
  activeType: ComposerType
  composerRef: RefObject<HTMLDivElement | null>
  onTypeChange: (value: ComposerType) => void
  onItemCreated: (item: FeedItem) => void
}

const composerTabs: Array<{
  value: ComposerType
  label: string
  Icon: typeof PenLine
  colorClass: string
}> = [
  { value: 'post', label: 'Пост', Icon: PenLine, colorClass: 'text-blue-600' },
  { value: 'poll', label: 'Опрос', Icon: BarChart3, colorClass: 'text-orange-500' },
  { value: 'quiz', label: 'Викторина', Icon: HelpCircle, colorClass: 'text-violet-500' },
  { value: 'article', label: 'Статья', Icon: FileText, colorClass: 'text-emerald-600' },
]

export const ProfileComposer = ({
  activeType,
  composerRef,
  onTypeChange,
  onItemCreated,
}: ProfileComposerProps) => {
  return (
    <Card ref={composerRef}>
      <CardHeader>
        <CardTitle className="text-base">Создать пост</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeType} onValueChange={(value) => onTypeChange(value as ComposerType)}>
          <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {composerTabs.map(({ value, label, Icon, colorClass }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:shadow-none sm:flex-row sm:text-sm"
                aria-label={label}
              >
                <Icon className={cn('h-4 w-4', colorClass)} />
                <span className="sr-only">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="post" className="mt-4">
            <ComposerPostForm onCreated={onItemCreated} />
          </TabsContent>
          <TabsContent value="poll" className="mt-4">
            <ComposerPollForm onCreated={onItemCreated} />
          </TabsContent>
          <TabsContent value="quiz" className="mt-4">
            <ComposerQuizForm onCreated={onItemCreated} />
          </TabsContent>
          <TabsContent value="article" className="mt-4">
            <ComposerArticleForm onCreated={onItemCreated} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

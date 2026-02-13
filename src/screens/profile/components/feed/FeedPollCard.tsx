'use client'

import { useEffect, useMemo, useState } from 'react'

import type { FeedPoll } from '@/shared/types/profile'
import { Button } from '@/ui/widgets/button'
import { CardContent } from '@/ui/widgets/card'
import { cn } from '@/lib/utils'

interface FeedPollCardProps {
  poll: FeedPoll
  onVote: (pollId: string, optionIds: string[]) => void
}

export const FeedPollCard = ({ poll, onVote }: FeedPollCardProps) => {
  const hasVoted = Boolean(poll.userVoteIds.length)
  const [draftVotes, setDraftVotes] = useState<string[]>([])

  useEffect(() => {
    if (hasVoted) {
      setDraftVotes([])
    }
  }, [hasVoted])

  const totalVotes = useMemo(() => {
    if (poll.totalVotes) {
      return poll.totalVotes
    }
    return poll.options.reduce((sum, option) => sum + option.votes, 0)
  }, [poll.options, poll.totalVotes])

  const toggleDraft = (optionId: string) => {
    setDraftVotes((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    )
  }

  const handleOptionClick = (optionId: string) => {
    if (hasVoted) {
      return
    }

    if (poll.multiple) {
      toggleDraft(optionId)
      return
    }

    onVote(poll.id, [optionId])
  }

  const handleSubmitMultiple = () => {
    if (!draftVotes.length || hasVoted) {
      return
    }

    onVote(poll.id, draftVotes)
  }

  return (
    <CardContent className="space-y-4">
      <div>
        <div className="text-sm font-semibold">{poll.question}</div>
        <div className="text-xs text-muted-foreground">{poll.duration}</div>
      </div>
      {hasVoted ? (
        <div className="space-y-3">
          {poll.options.map((option) => {
            const percent = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0
            const isSelected = poll.userVoteIds.includes(option.id)

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(isSelected && 'font-medium text-primary')}>
                    {option.text}
                  </span>
                  <span className="text-xs text-muted-foreground">{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-foreground/20"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="text-xs text-muted-foreground">{totalVotes} голосов</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2">
            {poll.options.map((option) => {
              const isSelected = draftVotes.includes(option.id)

              return (
                <Button
                  key={option.id}
                  variant={poll.multiple && isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => handleOptionClick(option.id)}
                >
                  {option.text}
                </Button>
              )
            })}
          </div>
          {poll.multiple ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Можно выбрать несколько вариантов</span>
              <Button size="sm" onClick={handleSubmitMultiple} disabled={!draftVotes.length}>
                Проголосовать
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </CardContent>
  )
}

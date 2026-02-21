'use client'

import { memo, useCallback } from 'react'
import type { FeedQuiz } from '@/shared/types/profile'
import { Loader2 } from 'lucide-react'
import { CardContent } from '@/ui/widgets/card'
import { cn } from '@/lib/utils'

interface FeedQuizCardProps {
  quiz: FeedQuiz
  onAnswer: (quizId: string, optionId: string) => void
  loading?: boolean
}

const FeedQuizCardComponent = ({ quiz, onAnswer, loading = false }: FeedQuizCardProps) => {
  const hasAnswered = Boolean(quiz.userAnswerId)
  const isDisabled = hasAnswered || loading

  const handleAnswer = useCallback((optionId: string) => {
    if (isDisabled) {
      return
    }

    onAnswer(quiz.id, optionId)
  }, [isDisabled, onAnswer, quiz.id])

  const getOptionStyle = useCallback((optionId: string) => {
    if (!hasAnswered) {
      return 'border-border hover:border-muted-foreground/50'
    }

    if (!quiz.correctOptionId) {
      if (quiz.userAnswerId === optionId) {
        return 'border-foreground/30 bg-foreground/5 text-foreground'
      }
      return 'border-border text-muted-foreground'
    }

    if (optionId === quiz.correctOptionId) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (quiz.userAnswerId === optionId) {
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    }

    return 'border-border text-muted-foreground'
  }, [hasAnswered, quiz.correctOptionId, quiz.userAnswerId])

  return (
    <CardContent className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold">{quiz.question}</div>
        {loading ? (
          <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <div className="grid gap-2">
        {quiz.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
              getOptionStyle(option.id),
            )}
            onClick={() => handleAnswer(option.id)}
            disabled={isDisabled}
          >
            {option.text}
          </button>
        ))}
      </div>
      {hasAnswered && quiz.explanation ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {quiz.explanation}
        </div>
      ) : null}
    </CardContent>
  )
}

export const FeedQuizCard = memo(FeedQuizCardComponent)
FeedQuizCard.displayName = 'FeedQuizCard'

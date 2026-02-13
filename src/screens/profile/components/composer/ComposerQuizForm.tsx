'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'

import type { FeedItem } from '@/shared/types/profile'
import { feedApi } from '@/features/feed/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Textarea } from '@/ui/widgets/textarea'

interface ComposerQuizFormProps {
  onCreated: (item: FeedItem) => void
}

interface QuizFormValues {
  question: string
  options: Array<{ value: string }>
  correctIndex: string | null
  explanation: string
}

const QUIZ_OPTION_IDS = ['a', 'b', 'c', 'd']

const defaultValues: QuizFormValues = {
  question: '',
  options: [{ value: '' }, { value: '' }, { value: '' }],
  correctIndex: null,
  explanation: '',
}

export const ComposerQuizForm = ({ onCreated }: ComposerQuizFormProps) => {
  const { control, register, handleSubmit, reset, watch, setValue } = useForm<QuizFormValues>({
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const correctIndex = watch('correctIndex')

  const handleRemoveOption = (index: number) => {
    const currentIndex = correctIndex ? Number(correctIndex) : null
    if (currentIndex !== null) {
      if (currentIndex === index) {
        setValue('correctIndex', null)
      } else if (currentIndex > index) {
        setValue('correctIndex', String(currentIndex - 1))
      }
    }

    remove(index)
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null)

    const question = values.question.trim()
    const normalizedOptions = values.options.map((option) => option.value.trim())
    const selectedIndex = values.correctIndex ? Number(values.correctIndex) : null

    if (!question) {
      setError('Введите вопрос для викторины')
      return
    }

    if (normalizedOptions.some((value) => !value)) {
      setError('Заполните все варианты ответа')
      return
    }

    if (normalizedOptions.length < 3) {
      setError('Нужно минимум три варианта ответа')
      return
    }

    if (selectedIndex === null || Number.isNaN(selectedIndex)) {
      setError('Выберите правильный ответ')
      return
    }

    const correctOptionId = QUIZ_OPTION_IDS[selectedIndex]
    if (!correctOptionId) {
      setError('Некорректный правильный ответ')
      return
    }

    setLoading(true)

    try {
      const createdItem = await feedApi.createQuiz({
        question,
        options: normalizedOptions,
        correctOptionId,
        explanation: values.explanation.trim() || undefined,
      })

      onCreated(createdItem)
      reset(defaultValues)
    } catch (quizError) {
      setError(getApiErrorMessage(quizError))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input type="hidden" {...register('correctIndex')} />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="quiz-question">Вопрос</Label>
        <Input id="quiz-question" {...register('question')} disabled={loading} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Варианты</Label>
          <span className="text-xs text-muted-foreground">{fields.length}/4</span>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="radio"
                value={String(index)}
                className="h-4 w-4 accent-primary"
                checked={correctIndex === String(index)}
                onChange={() => setValue('correctIndex', String(index))}
                disabled={loading}
              />
              <Input
                {...register(`options.${index}.value` as const)}
                placeholder={`Вариант ${index + 1}`}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
                disabled={loading || fields.length <= 3}
                aria-label="Удалить вариант"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">3–4 варианта</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: '' })}
            disabled={loading || fields.length >= 4}
          >
            <Plus className="h-4 w-4" />
            Добавить вариант
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quiz-explanation">Пояснение (optional)</Label>
        <Textarea id="quiz-explanation" {...register('explanation')} disabled={loading} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Создаем...' : 'Создать викторину'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

import type { FeedItem } from '@/shared/types/profile'
import { feedApi } from '@/features/feed/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Switch } from '@/ui/widgets/switch'

interface ComposerPollFormProps {
  onCreated: (item: FeedItem) => void
}

interface PollFormValues {
  question: string
  options: Array<{ value: string }>
  multiple: boolean
  duration: string
}

const durationOptions = ['1 день', '3 дня', '7 дней', '14 дней']

const defaultValues: PollFormValues = {
  question: '',
  options: [{ value: '' }, { value: '' }],
  multiple: false,
  duration: '3 дня',
}

export const ComposerPollForm = ({ onCreated }: ComposerPollFormProps) => {
  const { control, register, handleSubmit, reset } = useForm<PollFormValues>({
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setError(null)

    const question = values.question.trim()
    const normalizedOptions = values.options.map((option) => option.value.trim())

    if (!question) {
      setError('Введите вопрос для опроса')
      return
    }

    if (normalizedOptions.some((value) => !value)) {
      setError('Заполните все варианты')
      return
    }

    if (normalizedOptions.length < 2) {
      setError('Нужно минимум два варианта')
      return
    }

    setLoading(true)

    try {
      const createdItem = await feedApi.createPoll({
        question,
        options: normalizedOptions,
        multiple: values.multiple,
        duration: values.duration,
      })

      onCreated(createdItem)
      reset(defaultValues)
    } catch (pollError) {
      setError(getApiErrorMessage(pollError))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="poll-question">Вопрос</Label>
        <Input id="poll-question" {...register('question')} disabled={loading} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Варианты</Label>
          <span className="text-xs text-muted-foreground">{fields.length}/6</span>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                {...register(`options.${index}.value` as const)}
                placeholder={`Вариант ${index + 1}`}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={loading || fields.length <= 2}
                aria-label="Удалить вариант"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Минимум 2 варианта</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: '' })}
            disabled={loading || fields.length >= 6}
          >
            <Plus className="h-4 w-4" />
            Добавить вариант
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium">Разрешить несколько ответов</div>
            <div className="text-xs text-muted-foreground">Участник может выбрать больше одного</div>
          </div>
          <Controller
            control={control}
            name="multiple"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="poll-duration">Длительность</Label>
          <select
            id="poll-duration"
            {...register('duration')}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={loading}
          >
            {durationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Создаем...' : 'Создать опрос'}
        </Button>
      </div>
    </form>
  )
}

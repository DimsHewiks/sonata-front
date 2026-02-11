import type { Post } from '@/shared/types/post'

export const HomePage = () => {
  const posts: Post[] = [
    {
      id: 'post-1',
      author: 'Марина',
      title: 'Новый релиз: атмосфера и эмбиент',
      excerpt:
        'Собрали подборку свежих треков и плейлистов на вечерние сессии.',
      createdAt: '2 часа назад',
      tags: ['подборка', 'релизы'],
    },
    {
      id: 'post-2',
      author: 'Денис',
      title: 'Вопрос к комьюнити: лучшие плагины для вокала?',
      excerpt: 'Нужны рекомендации по обработке вокала в домашних условиях.',
      createdAt: 'вчера',
      tags: ['вопрос', 'звук'],
    },
    {
      id: 'post-3',
      author: 'Соната Team',
      title: 'Запуск новой ленты',
      excerpt:
        'Теперь можно подписываться на теги и видеть только релевантный контент.',
      createdAt: '3 дня назад',
      tags: ['обновление'],
    },
  ]

  const tagColorMap: Record<string, string> = {
    подборка: 'bg-amber-100 text-amber-700',
    релизы: 'bg-violet-100 text-violet-700',
    вопрос: 'bg-sky-100 text-sky-700',
    звук: 'bg-emerald-100 text-emerald-700',
    обновление: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Новости и посты</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Здесь будет главная лента: новости, посты, релизы и обсуждения.
            Сейчас это простой каркас, который можно легко заменить.
          </p>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{post.author}</span>
                <span>{post.createdAt}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={`${post.id}-${tag}`}
                    className={`rounded-full px-3 py-1 text-xs ${tagColorMap[tag] ?? 'bg-accent text-accent-foreground'}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold">Быстрые действия</div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
              <span>Создать пост</span>
              <span className="text-xs">скоро</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
              <span>Найти комьюнити</span>
              <span className="text-xs">скоро</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold">События</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Здесь появится календарь живых сессий, релизов и коллабораций.
          </p>
        </div>
      </aside>
    </div>
  )
}

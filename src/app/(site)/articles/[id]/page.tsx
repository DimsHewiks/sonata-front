import { ArticleViewPage } from '@/screens/articles/ArticleViewPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <ArticleViewPage articleId={id} />
}

import { ArticleEditorPage } from '@/screens/articles/ArticleEditorPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <ArticleEditorPage articleId={id ?? ''} />
}

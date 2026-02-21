'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const extractText = (node: unknown): string => {
  if (typeof node === 'string') {
    return node
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props
    return extractText(props?.children ?? '')
  }
  return ''
}

interface MarkdownProps {
  content: string
  className?: string
}

const MarkdownComponent = ({ content, className }: MarkdownProps) => {
  return (
    <div className={cn('article-content space-y-3 text-[18px] leading-[1.8] text-foreground/90', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ className: linkClass, ...props }) => (
            <a
              {...props}
              className={cn(
                'text-primary underline decoration-primary/60 underline-offset-4 transition hover:decoration-primary',
                linkClass,
              )}
              target="_blank"
              rel="noreferrer"
            />
          ),
          h1: ({ className: headingClass, ...props }) => (
            <h1
              {...props}
              className={cn(
                'mb-6 text-3xl font-semibold text-foreground',
                headingClass,
              )}
            />
          ),
          h2: ({ className: headingClass, ...props }) => (
            <h2
              {...props}
              className={cn(
                'relative mt-12 pb-3 text-2xl font-semibold text-foreground before:absolute before:bottom-0 before:left-0 before:h-px before:w-8 before:bg-primary/50',
                headingClass,
              )}
            />
          ),
          h3: ({ className: headingClass, ...props }) => (
            <h3 {...props} className={cn('mt-8 text-xl font-semibold text-foreground', headingClass)} />
          ),
          p: ({ className: paragraphClass, ...props }) => (
            <p {...props} className={cn('text-foreground/90', paragraphClass)} />
          ),
          blockquote: ({ className: quoteClass, ...props }) => {
            const text = extractText(props.children).trim()
            const callout =
              text.startsWith('ℹ') ? 'info' :
              text.startsWith('⚠') ? 'warning' :
              text.startsWith('💡') ? 'tip' :
              text.startsWith('🎵') ? 'music' : null

            const accentClass =
              callout === 'warning'
                ? 'border-l border-amber-400/60 bg-amber-50/30'
                : callout === 'tip'
                  ? 'border-l border-amber-400/60 bg-amber-50/40'
                  : callout === 'music'
                    ? 'border-l border-fuchsia-400/60 bg-fuchsia-50/30'
                    : 'border-l border-primary/40 bg-primary/5'

            const beforeContent =
              callout === 'tip'
                ? 'before:content-[""]'
                : 'before:content-["“"] before:text-primary/10'

            const cleanedChildren =
              callout === 'tip'
                ? extractText(props.children).replace(/^\s*💡️?\s*/u, '')
                : null

            return (
              <blockquote
                {...props}
                className={cn(
                  `relative my-6 rounded-md px-4 py-3 ${callout === 'tip' ? 'pl-10' : 'pl-9'} text-sm text-foreground/90 ${accentClass} ${beforeContent} before:absolute before:left-3 before:top-3 before:text-lg`,
                  quoteClass,
                )}
              >
                {callout === 'tip' ? (
                  <span className="absolute left-3 top-3 text-amber-500">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18h6" />
                      <path d="M10 21h4" />
                      <path d="M12 3a6 6 0 0 0-3 11c.6.4 1 1 1 1.7V17h4v-1.3c0-.7.4-1.3 1-1.7A6 6 0 0 0 12 3Z" />
                    </svg>
                  </span>
                ) : null}
                {callout === 'tip' ? (
                  <p className="m-0">{cleanedChildren}</p>
                ) : (
                  props.children
                )}
              </blockquote>
            )
          },
          ul: ({ className: listClass, ...props }) => (
            <ul
              {...props}
              className={cn('my-4 list-disc space-y-2 pl-6', listClass)}
            />
          ),
          ol: ({ className: listClass, ...props }) => (
            <ol
              {...props}
              className={cn('my-4 list-decimal space-y-2 pl-6', listClass)}
            />
          ),
          li: ({ className: itemClass, ...props }) => (
            <li {...props} className={cn('text-foreground/90', itemClass)} />
          ),
          hr: ({ className: hrClass, ...props }) => (
            <hr
              {...props}
              className={cn('my-12 h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent', hrClass)}
            />
          ),
          code: ({ className: codeClass, children, node, ...props }) => {
            const codeContent = String(children ?? '')
            const isBlockCode =
              Boolean(codeClass?.includes('language-')) ||
              codeContent.includes('\n') ||
              (node?.position
                ? node.position.start.line !== node.position.end.line
                : false)

            if (!isBlockCode) {
              return (
                <code
                  {...props}
                  className={cn(
                    'inline-block whitespace-pre-wrap rounded-sm border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[0.8em] text-foreground/90',
                    codeClass,
                  )}
                >
                  {children}
                </code>
              )
            }

            const normalizedContent =
              codeContent.endsWith('\n')
                ? codeContent.slice(0, -1)
                : codeContent

            return (
              <pre
                className="my-6 max-w-full overflow-x-auto rounded-sm border border-border/60 bg-muted/20 p-4"
              >
                <code
                  {...props}
                  className={cn(
                    'block whitespace-pre-wrap break-words font-mono text-[0.85em] leading-6 text-foreground/90',
                    codeClass,
                  )}
                >
                  {normalizedContent}
                </code>
              </pre>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export const Markdown = memo(MarkdownComponent)
Markdown.displayName = 'Markdown'

"use client";

import React, { useMemo } from 'react';
import { marked } from 'marked';
import insane from 'insane';
import { cn } from '@/lib/utils';

interface AiMarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Component to render sanitized markdown for AI responses
 */
export function AiMarkdownRenderer({ content, className }: AiMarkdownRendererProps) {
    const html = useMemo(() => {
        if (!content) return '';

        // Mark configure options
        marked.setOptions({
            gfm: true,
            breaks: true,
        });

        // Parse markdown to HTML
        const rawHtml = marked.parse(content) as string;

        // Sanitize HTML
        // We use 'insane' which is already a project dependency
        return insane(rawHtml, {
            allowedTags: [
                'p', 'br', 'b', 'i', 'strong', 'em', 'strike', 'code', 'pre',
                'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'blockquote', 'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'img', 'span', 'div'
            ],
            allowedAttributes: {
                'a': ['href', 'name', 'target', 'title'],
                'img': ['src', 'alt', 'title', 'width', 'height'],
                'code': ['class'],
                'span': ['class'],
                'div': ['class']
            },
        });
    }, [content]);

    return (
        <div
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "prose-p:leading-relaxed prose-p:my-1",
                "prose-ul:my-1 prose-ol:my-1",
                "prose-li:my-0.5",
                "prose-headings:my-2 prose-headings:font-semibold",
                "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
                "prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-lg",
                "prose-table:my-2 prose-table:border-collapse",
                "prose-th:border prose-th:border-border prose-th:p-1 prose-th:bg-muted/50",
                "prose-td:border prose-td:border-border prose-td:p-1",
                "prose-img:rounded-lg prose-img:my-2",
                "prose-a:text-primary prose-a:underline hover:prose-a:no-underline",
                className
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

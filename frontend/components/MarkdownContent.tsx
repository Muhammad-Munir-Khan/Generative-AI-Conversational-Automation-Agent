"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function MarkdownContent(props: { content: string }) {
  return React.createElement(
    "div",
    { className: "markdown-body" },
    React.createElement(
      ReactMarkdown,
      {
        remarkPlugins: [
          remarkGfm,
          // Disable single-$ math delimiters — they collide with currency.
          // Math now requires $$...$$ (block) or \(...\) / \[...\] (inline/block).
          [remarkMath, { singleDollarTextMath: false }],
        ],
        rehypePlugins: [rehypeKatex],
      },
      props.content
    )
  );
}
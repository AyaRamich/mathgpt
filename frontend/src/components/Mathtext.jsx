import { MathJax } from 'better-react-mathjax'


function ensureMathDelimited(text) {
  if (!text) return text

  const hasDelimiters =
    /\$.*\$/.test(text) || /\\\(.*\\\)/.test(text) || /\\\[.*\\\]/.test(text)
  if (hasDelimiters) return text

  const looksLikeLatex = /\\[a-zA-Z]+/.test(text) || /[\^_{}]/.test(text)
  if (looksLikeLatex) {
    return `\\(${text}\\)` 
  }

  return text
}

export default function MathText({ children, inline = false }) {
  if (!children) return null
  const safeContent = ensureMathDelimited(children)
  return (
    <MathJax inline={inline} dynamic>
      {safeContent}
    </MathJax>
  )
}
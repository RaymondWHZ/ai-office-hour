export const DOCUMENT_SPECS = `
The document is in extended HTML format with custom tags for comments and LaTeX equations.\
- Output nothing else but the html string; no code block.
- Directly start from body content; no need to include html, head, or body tags.
- Only h1, h2, h3, p, ul, ol, li, code blocks are used; don't use other HTML tags.
- Follow general guidelines for titles, paragraphs, lists, and code blocks.
- Use tag like <latex data="f(x) = 3x^2 + 2x - 5"/> for math equations
- Do not use <comment> tags when converting the document from original text
`;

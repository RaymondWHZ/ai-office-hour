/**
 * SYSTEM PROMPTS
 * Owner: Engineering Team (CRITICAL - DO NOT EDIT WITHOUT TECHNICAL REVIEW)
 *
 * Contains system-critical tool specifications, workflow rules, and format requirements.
 * Changes to this file can break the application functionality.
 */

export const RESPONSE_FORMAT = `
RESPONSE FORMAT:
- Use markdown format
- You may use $...$ for inline math in your markdown explanation
- You can use $$...$$ for block math but avoid using it too often
- Always leave at lease one space before and after dollar signs that surrounds the math expression for markdown to work correctly
- Especially careful with punctuations, you need to leave a space before period, comma, bracket, etc. if the sentence ends with a math expression
- For example, write "The result is $5$ ." instead of "The result is $5$."
- Use tools to edit the document and generate follow-up options
- DO NOT output JSON - use the provided tools instead`;

export const DOCUMENT_FORMAT = `
Document Format Specifications
- The document is in extended HTML format with custom tags for comments and LaTeX equations
- It directly start from body content; no need to include html, head, or body tags
- Output nothing else but the html string; no code block surrounding it
- Only h1, h2, h3, p, ul, ol, li, code blocks are used; don't use other HTML tags
- Use <latex data="mathematical expression"/> to add equations
- Use <comment data="comment">words</comment> to add inline comments to words; $$ inline latex math syntax is supported in data attribute
- Use <card>...</card> to wrap blocks of content that should be visually distinguished (like explanations, hints, etc.)
- Remember this is a HTML format; no markdown syntax in the document (except in comment data attribute)`;

export const TOOL_EDIT_DOCUMENT = `
TOOL USAGE - edit_document:
- Call this tool to make edits to the document, follow the "Document Format Specifications"
- Edit is done by replacing specific text segments with new content
- Each edit must have a "search" string to locate the text and a "replace" string with the new content
- You need to include a summary for the edits your are going to make
- Include 3-5 words of context before and after the target text
- If the text appears multiple times, include unique context
- Preserve original formatting (spacing, capitalization, line breaks)
- If you don't need to edit the document, don't call this tool`;

export const TOOL_GENERATE_OPTIONS = `
TOOL USAGE - generate_options:
- Call this tool to provide user with clickable follow-up options
- Each option should have a clear "label" (button text, 2-5 words) and "value" (the full prompt that will be sent)
- Whenever you call the tool, the conversation will end`;

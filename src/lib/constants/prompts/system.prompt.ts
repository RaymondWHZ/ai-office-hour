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
- Use <response question="optional question" submitted="false">...</response> to create interactive answer blocks for students
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

export const RESPONSE_BLOCK_USAGE = `
More details on response block usage:
- Use <response> tags to create interactive blocks where students can write their answers
- Syntax: <response question="optional question text" submitted="false">placeholder or prompt text</response>
- The "question" attribute is optional - use it to display what question the student should answer
- The "submitted" attribute tracks submission state and starts as "false"
- Students can edit the content inside the block and click "Submit for Review" to send their answer to you
- Use response blocks when you want the student to:
  - Practice solving a problem step-by-step
  - Write their reasoning or explanation
  - Answer a comprehension check question
  - Complete a mini-exercise before continuing
- Example usages:
  <response question="What is the derivative of x^2?"><p></p></response>
  <response><p></p></response>
- When a student submits their response, you will receive it as a message with their question (if provided) and answer clearly labeled
- After receiving their response, provide constructive feedback and guide them forward`;

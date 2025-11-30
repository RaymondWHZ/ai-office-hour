import type { EditOperation } from "$lib/tools";

/**
 * Applies a series of edit operations to document content using search-replace.
 *
 * Strategy:
 * - Single match: Replace directly
 * - No match: Skip with warning
 * - Multiple matches: Replace first occurrence with warning
 *
 * @param content - The original document content
 * @param edits - Array of search-replace operations
 * @returns Updated document content
 */
export function applyEdits(content: string, edits: EditOperation[]): string {
  let updatedContent = content;

  for (const edit of edits) {
    const { search, replace } = edit;

    if (!updatedContent.includes(search)) {
      // No match found - skip this edit
      throw new Error(`Search text not found; no edits made: ${search}`);
    }

    // Replace the first occurrence
    updatedContent = updatedContent.replace(search, replace);
  }

  return updatedContent;
}

/**
 * Escapes special regex characters in a string for literal matching.
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Escapes special characters for use in HTML attributes.
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Updates a response block's status and hint attributes by matching the question text.
 *
 * @param content - The document HTML content
 * @param question - The question text to match (used to find the response block)
 * @param status - The new status ("success" or "error")
 * @param hint - Optional hint text to add/update
 * @returns Updated document content
 * @throws Error if no matching response block is found
 */
export const updateResponseBlock = (
  content: string,
  question: string,
  status: "success" | "error",
  hint?: string,
): string => {
  // Build regex to find response tag with matching question attribute
  const escapedQuestion = escapeRegExp(question);
  const responseRegex = new RegExp(
    `<response([^>]*?)question="${escapedQuestion}"([^>]*?)>`,
    "g",
  );

  const matches = content.match(responseRegex);

  if (!matches || matches.length === 0) {
    throw new Error(`No response block found with question: "${question}"`);
  }

  // Update the first matching response block
  let updated = false;
  const updatedContent = content.replace(responseRegex, (match) => {
    if (updated) return match; // Only update first match
    updated = true;

    // Remove existing status and hint attributes
    let newTag = match
      .replace(/\s+status="[^"]*"/g, "")
      .replace(/\s+hint="[^"]*"/g, "");

    // Add new status attribute before the closing >
    const statusAttr = ` status="${status}"`;
    const hintAttr = hint ? ` hint="${escapeHtmlAttr(hint)}"` : "";

    // Insert attributes before the closing >
    newTag = newTag.replace(/>$/, `${statusAttr}${hintAttr}>`);

    return newTag;
  });

  return updatedContent;
};

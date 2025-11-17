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

    // Count occurrences of the search text
    const regex = new RegExp(escapeRegExp(search), "g");
    const matches = updatedContent.match(regex);

    if (!matches) {
      // No match found - skip this edit
      throw new Error(`Search text not found; no edits made`);
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

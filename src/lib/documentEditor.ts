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

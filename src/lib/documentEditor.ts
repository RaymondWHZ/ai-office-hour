/**
 * Applies a single edit operation to document content using search-replace.
 *
 * Strategy:
 * - Single match: Replace directly
 * - No match: Throw error
 * - Multiple matches: Replace first occurrence
 *
 * @param content - The original document content
 * @param search - The text to find
 * @param replace - The text to replace with
 * @returns Updated document content
 */
export const applyEdit = (
  content: string,
  search: string,
  replace: string,
): string => {
  if (!content.includes(search)) {
    throw new Error(`Search text not found: "${search}"`);
  }

  // Replace the first occurrence
  return content.replace(search, replace);
};

/**
 * Appends content to the end of the document.
 * This operation always succeeds.
 *
 * @param content - The original document content
 * @param appendContent - The content to append
 * @returns Updated document content
 */
export const appendToDocument = (
  content: string,
  appendContent: string,
): string => {
  return content + appendContent;
};

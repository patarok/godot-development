/**
 * --- TEXT CLAMPING UTILITIES ---
 * Provides three distinct methods for truncating text based on length constraints.
 */

/**
 * Clamps text to a specified word count.
 *
 * @param {string} text The string content to truncate.
 * @param {number} maxWords The maximum number of words allowed.
 * @param {string} [ellipsis='...'] The string to append if truncation occurs.
 * @returns {string} The truncated or original string.
 */
export function clampToWordCount(text, maxWords, ellipsis = '...') {
    if (typeof text !== 'string' || maxWords <= 0) {
        return '';
    }

    // Split the text by spaces/whitespace characters to get words
    const words = text.trim().split(/\s+/);

    if (words.length <= maxWords) {
        return text;
    }

    // Join the words up to the maximum count and append ellipsis
    const clampedText = words.slice(0, maxWords).join(' ');
    return `${clampedText}${ellipsis}`;
}

/**
 * Clamps text to a specified letter count (excluding whitespace).
 *
 * @param {string} text The string content to truncate.
 * @param {number} maxLetters The maximum number of non-whitespace characters allowed.
 * @param {string} [ellipsis='...'] The string to append if truncation occurs.
 * @returns {string} The truncated or original string.
 */
export function clampToLetterCount(text, maxLetters, ellipsis = '...') {
    if (typeof text !== 'string' || maxLetters <= 0) {
        return '';
    }

    // Remove all whitespace to count only significant characters
    const cleanText = text.replace(/\s/g, '');

    if (cleanText.length <= maxLetters) {
        return text;
    }

    // Find the original text segment corresponding to the maxLetters count
    let charCount = 0;
    let clampIndex = -1;

    for (let i = 0; i < text.length; i++) {
        if (!/\s/.test(text[i])) { // Check if character is NOT whitespace
            charCount++;
        }

        if (charCount > maxLetters) {
            clampIndex = i;
            break;
        }
    }

    // Use the index found and append the ellipsis
    return `${text.slice(0, clampIndex).trim()}${ellipsis}`;
}

/**
 * Clamps text to a total character count (including whitespace).
 * This is the simplest and most common form of truncation.
 *
 * @param {string} text The string content to truncate.
 * @param {number} maxChars The maximum total number of characters allowed.
 * @param {string} [ellipsis='...'] The string to append if truncation occurs.
 * @returns {string} The truncated or original string.
 */
export function clampToTotalChars(text, maxChars, ellipsis = '...') {
    if (typeof text !== 'string' || maxChars <= 0) {
        return '';
    }

    if (text.length <= maxChars) {
        return text;
    }

    // Slice the string at the max length and append ellipsis
    return `${text.slice(0, maxChars).trim()}${ellipsis}`;
}

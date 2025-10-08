/**
 * Formats a number into a currency string based on the specified locale and currency.
 * * @param {number} amount The number to format (e.g., 80000).
 * @param {string} locale The BCP 47 language tag (e.g., 'en-US', 'de-DE', 'ja-JP').
 * @param {string} currency The ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY').
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(amount, locale, currency) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '';
    }

    // Fallback to a default if locale or currency are missing
    const safeLocale = locale || 'en-US';
    const safeCurrency = currency || 'USD';

    try {
        // Intl.NumberFormat handles all localization rules:
        // - Thousand separators (comma vs. period)
        // - Decimal separators (period vs. comma)
        // - Currency symbol placement ($80.00 vs. 80,00 €)
        // - Number of minor units (JPY uses 0, USD/EUR use 2)
        return new Intl.NumberFormat(safeLocale, {
            style: 'currency',
            currency: safeCurrency,
            // You can optionally add other options here, like:
            // currencyDisplay: 'symbol',
        }).format(amount);
    } catch (e) {
        console.error('Error formatting currency:', e);
        return `${safeCurrency} ${amount}`; // Graceful fallback
    }
}

export function formatCurrencyInt(amount, locale, currency) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '';
    }

    // Fallback to a default if locale or currency are missing
    const safeLocale = locale || 'en-US';
    const safeCurrency = currency || 'USD';

    try {
        return new Intl.NumberFormat(safeLocale, {
            style: 'currency',
            currency: safeCurrency,
            // 💰 The change is here: Force 0 decimal places
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (e) {
        console.error('Error formatting currency:', e);
        return `${safeCurrency} ${amount}`; // Graceful fallback
    }
}
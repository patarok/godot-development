/**
 * Formats a date into a short, locale-specific format (MM.DD.YYYY or DD.MM.YYYY).
 *
 * @param {string|Date|number} dateInput The date input (string, Date object, or timestamp).
 * @param {'US'|'EUR'} formatLocale The desired output format locale ('US' for MM.DD.YYYY, 'EUR' for DD.MM.YYYY).
 * @returns {string} The formatted date string (e.g., '12.24.2025' or '24.12.2025').
 */
export function dateMat(dateInput, formatLocale) {
    // Handle null, undefined, or empty string
    if (dateInput == null || dateInput === '') {
        return '';
    }

    let date;

    // Convert input to Date object
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else {
        console.error('Invalid date input type:', typeof dateInput);
        return '';
    }

    // Validate the date
    if (isNaN(date.getTime())) {
        console.error('Invalid date provided:', dateInput);
        return typeof dateInput === 'string' ? dateInput : '';
    }

    let intlLocale;

    // Determine the underlying Intl locale string based on the user's requested format:
    // 'en-US' guarantees MM/DD/YYYY order.
    // 'en-GB' (UK/European convention) guarantees DD/MM/YYYY order.
    switch (formatLocale?.toUpperCase()) {
        case 'US':
            intlLocale = 'en-US';
            break;
        case 'EUR':
            intlLocale = 'en-GB';
            break;
        default:
            console.warn(`Unknown format locale specified: ${formatLocale}. Falling back to 'en-US'.`);
            intlLocale = 'en-US';
    }

    try {
        const formatter = new Intl.DateTimeFormat(intlLocale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        // 1. Format the date using the determined locale. This output will use the
        //    locale's default separator (usually '/' or '-').
        const formattedDate = formatter.format(date);

        // 2. Replace the default separator with a dot (.) as requested by the user.
        return formattedDate.replace(/[-\/]/g, '.');

    } catch (e) {
        console.error('Error formatting date:', e);
        return typeof dateInput === 'string' ? dateInput : '';
    }
}
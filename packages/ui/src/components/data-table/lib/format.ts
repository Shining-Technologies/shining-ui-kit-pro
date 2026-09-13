/**
 * The locale a table formats numbers and dates in, and sorts text by, when the
 * application does not pass `locale`.
 *
 * Fixed rather than the runtime's default: a Node server and a browser rarely
 * share a default locale, and "1,240" rendered on the server hydrating as
 * "1.240" in the browser is a hydration error.
 */
export const DEFAULT_TABLE_LOCALE = 'en-US'

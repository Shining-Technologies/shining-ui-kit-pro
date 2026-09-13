/**
 * `@shining-technologies/ui/csv`
 *
 * CSV and TSV export, kept out of the main entry: most tables never export
 * anything. No runtime dependencies.
 *
 * ```ts
 * import { downloadTableCsv } from '@shining-technologies/ui/csv'
 * <Button onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}>Export</Button>
 * ```
 *
 * `tableToCsv` and `csvToBlob` are pure and also work on a server;
 * `downloadTableCsv` needs a browser.
 */
export { csvToBlob, escapeCsvField, tableToCsv } from './serialize'
export type { CsvOptions } from './serialize'
export { downloadTableCsv } from './download'
export type { DownloadOptions } from './download'

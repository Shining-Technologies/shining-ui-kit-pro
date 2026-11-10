import {
  createBlock,
  createRow,
  emptyBlockDesign,
  emptyDesign,
  type Block,
  type BlockDesign,
  type BrandPreview,
  type DataSourceDefinition,
  type MergeFieldDefinition,
  type RichTextDesign,
  type SavedRow,
} from '@shining-technologies/email-builder'

/**
 * Sample data for the email-builder page: what a shining-email server would
 * return from `merge-fields/`, `brand/` and `data-sources/`, and the render a
 * `templates/<id>/preview/` call would send back.
 *
 * Images live in the gallery's `public/email/`. The editor accepts http and
 * https addresses only, so they are turned into absolute URLs on the page's
 * own origin.
 */
export function asset(name: string): string {
  return new URL(`${import.meta.env.BASE_URL}email/${name}`, window.location.href).href
}

export const MERGE_FIELDS: MergeFieldDefinition[] = [
  { key: 'contact.first_name', label: 'First name', group: 'Contact', sample: 'Priya' },
  { key: 'contact.last_name', label: 'Last name', group: 'Contact', sample: 'Raman' },
  { key: 'contact.email', label: 'Email', group: 'Contact', sample: 'priya@example.com' },
  {
    key: 'deal.title',
    label: 'Deal title',
    group: 'Deal',
    sample: 'Spring service plan',
    description: 'The name of the deal the email is about.',
  },
  { key: 'deal.amount', label: 'Deal amount', group: 'Deal', sample: '$1,240.00' },
  {
    key: 'booking.date',
    label: 'Booking date',
    group: 'Booking',
    sample: 'Thursday 14 May',
    description: 'Formatted in the contact’s time zone.',
  },
  { key: 'company.name', label: 'Company name', group: 'Company', sample: 'Northwind Services' },
]

export function brand(): BrandPreview {
  return {
    primary_color: '#2563eb',
    text_color: '#111827',
    muted_text_color: '#6b7280',
    link_color: '#2563eb',
    background_color: '#eef2f7',
    content_background_color: '#ffffff',
    button_text_color: '#ffffff',
    heading_font: 'georgia',
    body_font: 'arial',
    logo_url: asset('logo.svg'),
    logo_width: 160,
    logo_alignment: 'left',
    logo_alt: 'Northwind',
    business_name: 'Northwind Services',
    business_address: '12 Harbour Street, Sydney NSW 2000',
    phone: '+61 2 9000 1234',
    website: 'https://example.com',
    social_links: [
      { network: 'facebook', url: 'https://facebook.com/example' },
      { network: 'instagram', url: 'https://instagram.com/example' },
      { network: 'linkedin', url: 'https://linkedin.com/company/example' },
    ],
    footer_html: '<p>You are receiving this because you booked a service with us.</p>',
  }
}

export const DATA_SOURCES: DataSourceDefinition[] = [
  {
    key: 'deal.items',
    label: 'Deal line items',
    group: 'Deal',
    fields: [
      { key: 'name', label: 'Item' },
      { key: 'description', label: 'Description' },
      { key: 'quantity', label: 'Qty', align: 'right' },
      { key: 'total', label: 'Total', align: 'right' },
    ],
    default_columns: [
      { key: 'name', label: 'Item', secondary: 'description' },
      { key: 'quantity', label: 'Qty', align: 'right', width: 15 },
      { key: 'total', label: 'Total', align: 'right', width: 25 },
    ],
    totals_key: 'deal.totals',
    sample: [
      {
        name: 'Annual service',
        description: 'Two visits, parts included',
        quantity: '1',
        total: '$980.00',
      },
      { name: 'Filter kit', description: 'HEPA, set of four', quantity: '2', total: '$148.00' },
      { name: 'Call-out', description: 'Weekend', quantity: '1', total: '$112.00' },
    ],
    sample_totals: [
      { label: 'Subtotal', value: '$1,240.00' },
      { label: 'GST', value: '$124.00' },
      { label: 'Total', value: '$1,364.00', emphasis: true },
    ],
  },
]

/** `createBlock(type)` with its starting content replaced. */
function block<T extends Block>(type: T['type'], patch: Partial<T>): T {
  return { ...(createBlock(type) as T), ...patch }
}

/** A booking-confirmation email built with the design helpers, the way an app would seed one. */
export function sampleBlockDesign(): BlockDesign {
  const design = emptyBlockDesign()
  const source = DATA_SOURCES[0]!

  const header = createRow('100', [
    block('image', { src: asset('logo.svg'), alt: 'Northwind', width: 160, align: 'left' }),
  ])
  const hero = createRow('100', [
    block('image', {
      src: asset('hero.svg'),
      alt: 'Mountains at dawn',
      width: 'full',
      align: 'center',
    }),
    block('heading', {
      level: 1,
      html: 'Your service is booked, {{ contact.first_name|there }}',
      align: 'left',
    }),
    block('text', {
      html:
        '<p>Thanks for booking <strong>{{ deal.title }}</strong>. A technician will arrive on ' +
        '<strong>{{ booking.date }}</strong> between 8am and 10am. Here is what is included:</p>',
      align: 'left',
    }),
  ])
  const items = createRow('100', [
    block('table', {
      source: source.key,
      totals: source.totals_key ?? null,
      columns: source.default_columns,
      show_header: true,
      striped: true,
    }),
    block('button', {
      label: 'Manage booking',
      url: 'https://example.com/bookings',
      align: 'left',
    }),
  ])
  const signature = createRow('33-67')
  signature.columns[0]!.blocks.push(
    block('avatar', {
      src: asset('avatar.svg'),
      alt: 'Ana Ortiz',
      size: 72,
      shape: 'circle',
      align: 'center',
    }),
  )
  signature.columns[1]!.blocks.push(
    block('text', {
      html: '<p><strong>Ana Ortiz</strong><br>Customer care, Northwind Services<br>Reply to this email any time.</p>',
      align: 'left',
    }),
  )
  const footer = createRow('100', [
    block('divider', {}),
    block('social', { source: 'brand', align: 'center' }),
    block('footer', { show_business: true, show_address: true, show_social: false }),
  ])

  return { ...design, rows: [header, hero, items, signature, footer] }
}

export function sampleRichTextDesign(): RichTextDesign {
  return emptyDesign(
    '<h2>Hi <span data-merge-field="contact.first_name">{{ contact.first_name|there }}</span>,</h2>' +
      '<p>Your quote for <strong>' +
      '<span data-merge-field="deal.title">{{ deal.title }}</span></strong> is ready. ' +
      'It comes to <span data-merge-field="deal.amount">{{ deal.amount }}</span>, including parts and labour.</p>' +
      '<ul><li>Two scheduled visits</li><li>Parts and filters included</li><li>12-month workmanship guarantee</li></ul>' +
      '<a data-type="button" data-align="left" href="https://example.com/quote">View your quote</a>' +
      '<p>Questions? Just reply — <em>Ana, Northwind Services</em></p>',
  )
}

/**
 * An in-memory `SavedRowsAdapter`: what the `saved-rows/` API does, without a
 * server. Rows saved here last until the page reloads.
 */
export function memorySavedRows() {
  let rows: SavedRow[] = [
    {
      id: 'promo-banner',
      name: 'Promo banner',
      row: createRow('100', [
        block('heading', { level: 2, html: '15% off your next service', align: 'center' }),
        block('button', { label: 'Book now', url: 'https://example.com/book', align: 'center' }),
      ]),
    },
  ]
  const delay = <T>(value: T) =>
    new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 150))

  return {
    list: () => delay(rows),
    save: (name: string, row: SavedRow['row'], _width?: number, options?: { shared?: boolean }) => {
      const saved: SavedRow = {
        id: crypto.randomUUID(),
        name,
        row,
        shared: options?.shared,
        usageCount: 0,
      }
      rows = [...rows, saved]
      return delay(saved)
    },
    update: (id: SavedRow['id'], patch: { name?: string; row?: SavedRow['row'] }) => {
      rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
      return delay(rows.find((r) => r.id === id)!)
    },
    get: (id: SavedRow['id']) => delay(rows.find((r) => r.id === id) ?? null),
    remove: (id: SavedRow['id']) => {
      rows = rows.filter((r) => r.id !== id)
      return delay(undefined)
    },
  }
}

/** The gallery has no server to upload to, so an upload puts in one of the sample pictures. */
export async function fakeUpload(file: File) {
  const name = file.type.startsWith('image/') ? 'hero.svg' : 'logo.svg'
  return { url: asset(name), alt: file.name.replace(/\.[^.]+$/, '') }
}

/** What `POST templates/<id>/preview/` returns for the rich-text sample: the server's render. */
export function samplePreview() {
  const logo = asset('logo.svg')
  const hero = asset('hero.svg')
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body { margin: 0; background: #eef2f7; font-family: Arial, Helvetica, sans-serif; color: #111827; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 24px 12px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; }
  .pad { padding: 24px; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; margin: 0 0 14px; }
  table.items { width: 100%; border-collapse: collapse; font-size: 14px; margin: 8px 0 20px; }
  table.items th { text-align: left; background: #2563eb; color: #fff; padding: 8px; }
  table.items td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
  table.items .r { text-align: right; }
  .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
  .foot { text-align: center; color: #6b7280; font-size: 12px; padding: 20px 12px; line-height: 1.6; }
  @media (max-width: 480px) { .pad { padding: 16px; } h1 { font-size: 22px; } }
</style></head>
<body><div class="wrap"><div class="card">
  <div class="pad" style="padding-bottom:0"><img src="${logo}" width="160" alt="Northwind"></div>
  <img src="${hero}" alt="Mountains at dawn" style="display:block;width:100%;height:auto;margin-top:16px">
  <div class="pad">
    <h1>Your service is booked, Priya</h1>
    <p>Thanks for booking <strong>Spring service plan</strong>. A technician will arrive on <strong>Thursday 14 May</strong> between 8am and 10am. Here is what is included:</p>
    <table class="items" role="presentation">
      <tr><th>Item</th><th class="r">Qty</th><th class="r">Total</th></tr>
      <tr><td>Annual service<br><small style="color:#6b7280">Two visits, parts included</small></td><td class="r">1</td><td class="r">$980.00</td></tr>
      <tr><td>Filter kit<br><small style="color:#6b7280">HEPA, set of four</small></td><td class="r">2</td><td class="r">$148.00</td></tr>
      <tr><td>Call-out<br><small style="color:#6b7280">Weekend</small></td><td class="r">1</td><td class="r">$112.00</td></tr>
      <tr><td colspan="2" class="r"><strong>Total</strong></td><td class="r"><strong>$1,364.00</strong></td></tr>
    </table>
    <a class="btn" href="https://example.com/bookings">Manage booking</a>
  </div>
</div>
<div class="foot">Northwind Services · 12 Harbour Street, Sydney NSW 2000<br>You are receiving this because you booked a service with us.<br><a href="#" style="color:#6b7280">Unsubscribe</a></div>
</div></body></html>`

  const text = `Your service is booked, Priya

Thanks for booking Spring service plan. A technician will arrive on Thursday 14 May between 8am and 10am.

  Annual service (Two visits, parts included)  x1  $980.00
  Filter kit (HEPA, set of four)               x2  $148.00
  Call-out (Weekend)                           x1  $112.00
  Total                                            $1,364.00

Manage booking: https://example.com/bookings

--
Northwind Services, 12 Harbour Street, Sydney NSW 2000
Unsubscribe: https://example.com/unsubscribe`

  return {
    html,
    text,
    subject: 'Your service is booked, Priya',
    preheader: 'Thursday 14 May, 8–10am. Everything you need to know.',
    warnings: [
      'The image "Mountains at dawn" is an SVG; some mail clients (Outlook, Gmail) do not show SVG.',
    ],
  }
}

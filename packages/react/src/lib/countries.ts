/**
 * Countries and their international dialling codes.
 *
 * Kept as one delimited string rather than 240 object literals: the parsed
 * result is identical, the source is a tenth of the size, and a dialling code
 * that changes is a one-word edit rather than a five-line one.
 *
 * Format per record: `ISO-3166 alpha-2,Name,dial code`.
 */
const DATA =
  'AF,Afghanistan,93|AL,Albania,355|DZ,Algeria,213|AD,Andorra,376|AO,Angola,244|AG,Antigua and Barbuda,1|AR,Argentina,54|AM,Armenia,374|AW,Aruba,297|AU,Australia,61|AT,Austria,43|AZ,Azerbaijan,994|BS,Bahamas,1|BH,Bahrain,973|BD,Bangladesh,880|BB,Barbados,1|BY,Belarus,375|BE,Belgium,32|BZ,Belize,501|BJ,Benin,229|BM,Bermuda,1|BT,Bhutan,975|BO,Bolivia,591|BA,Bosnia and Herzegovina,387|BW,Botswana,267|BR,Brazil,55|BN,Brunei,673|BG,Bulgaria,359|BF,Burkina Faso,226|BI,Burundi,257|KH,Cambodia,855|CM,Cameroon,237|CA,Canada,1|CV,Cape Verde,238|KY,Cayman Islands,1|CF,Central African Republic,236|TD,Chad,235|CL,Chile,56|CN,China,86|CO,Colombia,57|KM,Comoros,269|CG,Congo,242|CD,Congo (DRC),243|CR,Costa Rica,506|CI,Côte d’Ivoire,225|HR,Croatia,385|CU,Cuba,53|CW,Curaçao,599|CY,Cyprus,357|CZ,Czechia,420|DK,Denmark,45|DJ,Djibouti,253|DM,Dominica,1|DO,Dominican Republic,1|EC,Ecuador,593|EG,Egypt,20|SV,El Salvador,503|GQ,Equatorial Guinea,240|ER,Eritrea,291|EE,Estonia,372|SZ,Eswatini,268|ET,Ethiopia,251|FJ,Fiji,679|FI,Finland,358|FR,France,33|PF,French Polynesia,689|GA,Gabon,241|GM,Gambia,220|GE,Georgia,995|DE,Germany,49|GH,Ghana,233|GI,Gibraltar,350|GR,Greece,30|GL,Greenland,299|GD,Grenada,1|GU,Guam,1|GT,Guatemala,502|GG,Guernsey,44|GN,Guinea,224|GW,Guinea-Bissau,245|GY,Guyana,592|HT,Haiti,509|HN,Honduras,504|HK,Hong Kong,852|HU,Hungary,36|IS,Iceland,354|IN,India,91|ID,Indonesia,62|IR,Iran,98|IQ,Iraq,964|IE,Ireland,353|IM,Isle of Man,44|IL,Israel,972|IT,Italy,39|JM,Jamaica,1|JP,Japan,81|JE,Jersey,44|JO,Jordan,962|KZ,Kazakhstan,7|KE,Kenya,254|KI,Kiribati,686|KW,Kuwait,965|KG,Kyrgyzstan,996|LA,Laos,856|LV,Latvia,371|LB,Lebanon,961|LS,Lesotho,266|LR,Liberia,231|LY,Libya,218|LI,Liechtenstein,423|LT,Lithuania,370|LU,Luxembourg,352|MO,Macao,853|MG,Madagascar,261|MW,Malawi,265|MY,Malaysia,60|MV,Maldives,960|ML,Mali,223|MT,Malta,356|MH,Marshall Islands,692|MR,Mauritania,222|MU,Mauritius,230|MX,Mexico,52|FM,Micronesia,691|MD,Moldova,373|MC,Monaco,377|MN,Mongolia,976|ME,Montenegro,382|MA,Morocco,212|MZ,Mozambique,258|MM,Myanmar,95|NA,Namibia,264|NR,Nauru,674|NP,Nepal,977|NL,Netherlands,31|NC,New Caledonia,687|NZ,New Zealand,64|NI,Nicaragua,505|NE,Niger,227|NG,Nigeria,234|KP,North Korea,850|MK,North Macedonia,389|NO,Norway,47|OM,Oman,968|PK,Pakistan,92|PW,Palau,680|PS,Palestine,970|PA,Panama,507|PG,Papua New Guinea,675|PY,Paraguay,595|PE,Peru,51|PH,Philippines,63|PL,Poland,48|PT,Portugal,351|PR,Puerto Rico,1|QA,Qatar,974|RE,Réunion,262|RO,Romania,40|RU,Russia,7|RW,Rwanda,250|WS,Samoa,685|SM,San Marino,378|SA,Saudi Arabia,966|SN,Senegal,221|RS,Serbia,381|SC,Seychelles,248|SL,Sierra Leone,232|SG,Singapore,65|SK,Slovakia,421|SI,Slovenia,386|SB,Solomon Islands,677|SO,Somalia,252|ZA,South Africa,27|KR,South Korea,82|SS,South Sudan,211|ES,Spain,34|LK,Sri Lanka,94|KN,St Kitts and Nevis,1|LC,St Lucia,1|VC,St Vincent and the Grenadines,1|SD,Sudan,249|SR,Suriname,597|SE,Sweden,46|CH,Switzerland,41|SY,Syria,963|TW,Taiwan,886|TJ,Tajikistan,992|TZ,Tanzania,255|TH,Thailand,66|TL,Timor-Leste,670|TG,Togo,228|TO,Tonga,676|TT,Trinidad and Tobago,1|TN,Tunisia,216|TR,Türkiye,90|TM,Turkmenistan,993|TC,Turks and Caicos Islands,1|TV,Tuvalu,688|UG,Uganda,256|UA,Ukraine,380|AE,United Arab Emirates,971|GB,United Kingdom,44|US,United States,1|UY,Uruguay,598|UZ,Uzbekistan,998|VU,Vanuatu,678|VA,Vatican City,39|VE,Venezuela,58|VN,Vietnam,84|YE,Yemen,967|ZM,Zambia,260|ZW,Zimbabwe,263'

export interface Country {
  /** ISO-3166 alpha-2, uppercase — `'AU'`. */
  code: string
  name: string
  /** International dialling code, without the `+` — `'61'`. */
  dial: string
  /** The regional-indicator pair for `code`, e.g. `'🇦🇺'`. */
  flag: string
}

/**
 * `'AU'` → `'🇦🇺'`.
 *
 * A flag emoji is just its two letters shifted into the regional-indicator
 * block, so 240 flags cost no bytes and no image requests. Platforms that
 * render no flag fall back to the two letters, which is still readable.
 */
export function flagFor(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((letter) => 0x1f1a5 + letter.charCodeAt(0)),
  )
}

/** Every country, in alphabetical order by name. */
export const COUNTRIES: Country[] = DATA.split('|').map((record) => {
  const [code, name, dial] = record.split(',') as [string, string, string]
  return { code, name, dial, flag: flagFor(code) }
})

const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]))

/** Look a country up by its alpha-2 code, case-insensitively. */
export function countryByCode(code: string | undefined | null): Country | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined
}

/**
 * Which country owns a dialling code that several of them share.
 *
 * `+1` is twenty countries and `+44` is four; a bare number in one of those
 * codes means the large one in practice, and picking the alphabetically first
 * instead would label every North American number as Antigua.
 */
const PRIMARY: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '39': 'IT',
  '44': 'GB',
  '61': 'AU',
  '262': 'RE',
  '599': 'CW',
}

/**
 * The country a `+…` number belongs to.
 *
 * Longest dial code first, so `+1 340` resolves before the bare `+1`.
 */
const BY_DIAL = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)

export function countryByDial(value: string): Country | undefined {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return undefined
  const match = BY_DIAL.find((country) => digits.startsWith(country.dial))
  if (!match) return undefined
  return countryByCode(PRIMARY[match.dial]) ?? match
}

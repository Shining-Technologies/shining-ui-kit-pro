import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'
import { THEME_PRESETS, createThemeCss } from '@shining-technologies/ui/theme'
import { users } from '@/lib/users'
import { USER_LOCALE, USER_TIME_ZONE, userColumns } from '@/lib/user-columns'

export function GET(request: Request) {
  const query = parseQuerySearchParams(new URL(request.url).searchParams, {
    columns: userColumns,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
  })
  const result = applyQuery(users, query, { columns: userColumns, timeZone: USER_TIME_ZONE, locale: USER_LOCALE })
  return Response.json({
    query,
    ...result,
    theme: {
      presets: THEME_PRESETS.length,
      css: createThemeCss({ primary: '#be123c' }).slice(0, 200),
    },
  })
}

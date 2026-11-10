/**
 * The gallery's router is the URL hash: `#<page>`, or `#<page>/<demo>` for one
 * example on a page. An empty hash is the home page. `App` listens for
 * `hashchange`, so navigating is only ever a matter of setting the hash.
 */
export const HOME = 'home'

export interface Route {
  sectionId: string
  /** A demo on the page, from `#<page>/<demo>`. */
  anchor?: string
}

export function readRoute(): Route {
  const [id = '', anchor] = window.location.hash.slice(1).split('/')
  return { sectionId: id || HOME, anchor: anchor || undefined }
}

export function go(id: string, anchor?: string) {
  const hash = id === HOME ? '' : anchor ? `${id}/${anchor}` : id
  if (window.location.hash.slice(1) === hash) {
    // Same place: still bring it back into view.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  if (hash) window.location.hash = hash
  else history.pushState(null, '', window.location.pathname + window.location.search)
  if (!hash) window.dispatchEvent(new HashChangeEvent('hashchange'))
}

let runtimePromise: Promise<void> | undefined

export function loadLynxWebRuntime(): Promise<void> {
  if (!import.meta.client)
    return Promise.resolve()

  runtimePromise ??= (async () => {
    const stylesheetId = 'lynx-web-runtime-styles'
    if (!document.getElementById(stylesheetId)) {
      const link = document.createElement('link')
      link.id = stylesheetId
      link.rel = 'stylesheet'
      link.href = '/lynx-runtime/static/css/client.css'
      document.head.appendChild(link)
    }

    const runtimeUrl = '/lynx-runtime/static/js/client.js'
    await import(/* @vite-ignore */ runtimeUrl)
    await customElements.whenDefined('lynx-view')
  })()

  return runtimePromise
}

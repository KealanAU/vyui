import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

/**
 * @param providerComponentName - The name(s) of the component(s) providing the context.
 *
 * There are situations where context can come from multiple components. In such cases, you might need to give an array of component names to provide your context, instead of just a single string.
 *
 * @param contextName The description for injection key symbol.
 */
export function createContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string,
) {
  const symbolDescription
    = typeof providerComponentName === 'string' && !contextName
      ? `${providerComponentName}Context`
      : contextName
        ?? (Array.isArray(providerComponentName)
          ? providerComponentName.join('-')
          : 'Context')

  // `Symbol.for` (global registry), not `Symbol`, on purpose.
  //
  // The rspeedy/Lynx build compiles every dual-`<script>` SFC twice (once via
  // rspack-vue-loader, once via builtin:swc-loader), so this module — and thus
  // `createContext` — can run more than once for the same component. A plain
  // `Symbol()` would mint a different key per copy: a child injecting through
  // one copy can't see a parent that provided through the other, and Vue
  // throws "Injection not found". A registry symbol is keyed by string, so
  // every copy resolves to the identical key. Descriptions are unique
  // per-component, so registry collisions are not a concern.
  const injectionKey: InjectionKey<ContextValue | null>
    = Symbol.for(`vyui:${symbolDescription}`)

  /**
   * @param fallback The context value to return if the injection fails.
   *
   * @throws When context injection failed and no fallback is specified.
   * This happens when the component injecting the context is not a child of the root component providing the context.
   */
  const injectContext = <
    T extends ContextValue | null | undefined = ContextValue,
  >(
    fallback?: T,
  ): T extends null ? ContextValue | null : ContextValue => {
    const context = inject(injectionKey, fallback)
    if (context)
      return context

    if (context === null)
      return context as any

    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within ${
        Array.isArray(providerComponentName)
          ? `one of the following components: ${providerComponentName.join(
            ', ',
          )}`
          : `\`${providerComponentName}\``
      }`,
    )
  }

  const provideContext = (contextValue: ContextValue) => {
    provide(injectionKey, contextValue)
    return contextValue
  }

  return [injectContext, provideContext] as const
}

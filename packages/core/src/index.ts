/**
 * Subscribes to navigation or query parameter changes and executes the provided callback function.
 *
 * Depending on the browser's support for the `navigation` API, this function uses either:
 * - `window.navigation` for modern browsers with native support, or
 * - A polyfill that listens for query parameter changes via custom events.
 *
 * @param {() => void} callback - The callback function to execute when a navigation or query parameter change occurs.
 * @returns {() => void} A function to unsubscribe the callback.
 */
export function subscribe(callback: () => void) {
    if ("navigation" in window) {
        return handleNavigationSubscribe(callback);
    }
    return handlePolyfillSubscribe(callback);
}

function handleNavigationSubscribe(callback: () => void) {
    window.navigation.addEventListener("navigatesuccess", callback);
    return () => {
        window.navigation.removeEventListener("navigatesuccess", callback);
    };
}

/**
 * Polyfill for the `navigation` event listener. It listens for changes in the query params and dispatches an event.
 */
if (
    typeof window !== "undefined" &&
    !("navigation" in window && !!window.navigation)
) {
    const event = new Event("query-params-changed");
    window.history.replaceState = new Proxy(window.history.replaceState, {
        apply: (originalFn, context, args) => {
            const output = originalFn.apply(
                context,
                args as [
                    data: unknown,
                    unused: string,
                    url?: string | URL | null | undefined,
                ]
            );
            window.dispatchEvent(event);
            return output;
        },
    });
}

function handlePolyfillSubscribe(callback: () => void) {
    window.addEventListener("query-params-changed", callback);
    return () => {
        window.removeEventListener("query-params-changed", callback);
    };
}

/**
 * Creates a getter function that extracts query parameters based on the provided configuration.
 *
 * @template Config - The configuration object type, where each key is a query parameter name and the value is a `QueryParamSetting`.
 * @param {Config} config - The configuration object defining how to decode and handle each query parameter.
 * @param {string | undefined} queryString - The query string to parse. If undefined, the current URL's query string will be used.
 * @returns {Object} An object where each key corresponds to a query parameter name and the value is the decoded value.
 */

export function createGetter<
    Config extends Record<string, QueryParamSetting<any>>,
>(config: Config, queryString: string | undefined) {
    const urlSearchParams = new URLSearchParams(queryString);
    const entries = Object.entries(config);
    const result = Object.fromEntries(
        entries.map(([name, setting]) => {
            const usedName = setting.paramName ?? name;
            const value = urlSearchParams.getAll(usedName);
            return [
                name,
                (!!value.length && setting.decoder(value)) ||
                    setting.defaultValue,
            ];
        })
    );

    return result as {
        [key in keyof Config]: GetValue<Config[key]>;
    };
}

/**
 * Creates a setter function that updates query parameters based on the provided configuration.
 *
 * @template Config - The configuration object type, where each key is a query parameter name and the value is a `QueryParamSetting`.
 * @param {Config} config - The configuration object defining how to encode and handle each query parameter.
 * @returns {Function} A function that takes an object of new values and updates the query parameters accordingly.
 */
export function createSetter<
    Config extends Record<string, QueryParamSetting<any>>,
>(config: Config) {
    return (
        newValues: Partial<{
            [key in keyof Config]: ReturnType<Config[key]["decoder"]> | null;
        }>
    ) => {
        console.log("sup", newValues);
        const params = new URLSearchParams(window.location.search);
        Object.keys(newValues).forEach((name) => {
            const value = newValues[name];
            if (value === null) {
                params.delete(name);
                return;
            }
            if (value === undefined) {
                return;
            }
            const usedName = config[name]?.paramName ?? name;
            const encodedValue = config[name]?.encoder(value) ?? [];

            // first remove the current values for the key
            params.delete(usedName);
            // then add the new values
            encodedValue.forEach((value) => {
                params.append(usedName, value);
            });
            const url = new URL(window.location.href);
            url.search = params.toString();
            window.history.replaceState(
                { ...window.history.state },
                url.toString(),
                url.toString()
            );
        });
    };
}

/**
 * Get the value type of a setting. If the decoder returns `undefined`, the default value will be used. If the default value is `undefined`,
 * the type will be `undefined`.
 */
type GetValue<T extends QueryParamSetting<unknown>> =
    ReturnType<T["decoder"]> extends infer ParamValue
        ? ParamValue extends NonNullable<ParamValue>
            ? ParamValue
            : T["defaultValue"] extends infer DefaultValue
              ? DefaultValue extends NonNullable<DefaultValue>
                  ? DefaultValue
                  : undefined
              : undefined
        : undefined;

/**
 * Get the current snapshot of the query params, but only for the keys that are in the config. The result of this function will be compared
 * in order to trigger the rerender of the hook.
 */
export function getSnapshot(names?: string[]) {
    if (!names) {
        const params = new URLSearchParams(window.location.search);
        return params.toString();
    }

    const params = new URLSearchParams(window.location.search);
    const keys = new URLSearchParams();

    names.forEach((name) => {
        const value = params.getAll(name);
        keys.delete(name);
        value.forEach((value) => keys.append(name, value));
    });

    return keys.toString();
}

export type QueryParamSetting<T> = {
    /**
     * A function to decode the query parameter value.
     */
    decoder: (value: string[]) => T | undefined;
    /**
     * The default value for the query parameter. If the query parameter is not present, this value will be used.
     */
    defaultValue?: T;
    /**
     * A function to encode the setted value to a string.
     */
    encoder: (value: T) => string[];
    /**
     * The name of the query parameter. If not provided, the key will be used.
     */
    paramName?: string;
};

export const stringSettings = {
    decoder: ([value]: string[]) => value as string | undefined,
    encoder: (value: string) => [value],
};

export const booleanSettings = {
    decoder: ([value]: string[]) => value === "true",
    encoder: (value: boolean) => [value.toString()],
};

export const numberSettings = {
    decoder: ([value]: string[]) => {
        const number = Number(value);
        return Number.isNaN(number) ? undefined : number;
    },
    encoder: (value: number) => [value.toString()],
};

export const dateSettings = {
    decoder: ([value]: string[]) => {
        if (!value) {
            return undefined;
        }
        try {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? undefined : date;
        } catch {
            return undefined;
        }
    },
    encoder: (value: Date) => [value.toISOString()],
};

export const stringArraySettings = {
    decoder: (value: string[]) => (value.length ? value : undefined),
    encoder: (value: string[]) => value,
};

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

export function getParamNames(
    config: Record<string, QueryParamSetting<unknown>>
) {
    return Object.keys(config).map((name) => config[name]?.paramName ?? name);
}

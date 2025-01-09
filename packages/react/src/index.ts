import { subscribe } from "@qstate/core";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";

/**
 * Custom hook to manage query parameters.
 * @param name - The name of the query parameter.
 * @param config - The configuration for the query parameter.
 * - `decoder` - A function to decode the query parameter value.
 * - `defaultValue` - The default value for the query parameter.
 * - `encoder` - A function to encode the query parameter value.
 * - `paramName` - The name of the query parameter. If not provided, the key will be used.
 *
 * @returns A tuple containing the current value of the query parameter and a setter function to update it.
 */
export function useQueryParam<T>(name: string, config: QueryParamSetting<T>) {
    const [value, setValue] = useQueryParams({ [name]: config });
    const setter = useCallback(
        (value: T | null) => setValue({ [name]: value }),
        [name, setValue]
    );

    return [value[name], setter] as const;
}

/**
 * Custom hook for managing query parameters in a React component.
 *
 * @param config - The configuration object that defines the query parameters and their settings.
 * @returns A tuple containing the parsed values of the query parameters and a setter function to update the query parameters.
 */
export default function useQueryParams<
    Config extends Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        QueryParamSetting<any>
    >,
>(config: Config) {
    const [isReady, setIsReady] = useState(false);
    const storage = useSyncExternalStore(
        useCallback(
            (cb) => {
                const subscribeValue = subscribe(cb);
                if (!isReady) {
                    setIsReady(true);
                }
                return subscribeValue;
            },
            [isReady]
        ),
        useCallback(() => getSnapshot(getParamNames(config)), [config]),
        useCallback(() => undefined, [])
    );

    /**
     * @param newValues - The new values to set in the query params. If the value is `null`, the key will be removed from the query params.
     */
    const setter = useCallback(
        (
            newValues: Partial<{
                [key in keyof Config]: ReturnType<
                    Config[key]["decoder"]
                > | null;
            }>
        ) => {
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
            });
            const url = new URL(window.location.href);
            url.search = params.toString();
            window.history.replaceState(
                { ...window.history.state },
                url.toString(),
                url.toString()
            );
        },
        [config]
    );

    const parsedValues = useMemo(() => {
        const urlSearchParams = new URLSearchParams(storage);
        const entries = Object.entries(config);
        const result = Object.fromEntries(
            entries.map(([name, setting]) => {
                const usedName = setting.paramName ?? name;
                const value = urlSearchParams.getAll(usedName);
                return [
                    name,
                    value.length
                        ? setting.decoder(value)
                        : setting.defaultValue,
                ];
            })
        );

        return result as {
            [key in keyof Config]: GetValue<Config[key]>;
        };
    }, [storage, config]);

    return [parsedValues, setter, isReady] as const;
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
        value.forEach((value) => {
            keys.append(name, value);
        });
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

export const numberSettings = {
    decoder: ([value]: string[]) => {
        const number = Number(value);
        return Number.isNaN(number) ? undefined : number;
    },
    encoder: (value: number) => [value.toString()],
};

export const stringSettings = {
    decoder: ([value]: string[]) => value as string | undefined,
    encoder: (value: string) => [value],
};

export const booleanSettings = {
    decoder: ([value]: string[]) => value === "true",
    encoder: (value: boolean) => [value.toString()],
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

export function getQueryParam(name: string) {
    if (typeof window === "undefined") {
        throw new Error("This function can only be used in the browser");
    }
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

function getParamNames(config: Record<string, QueryParamSetting<unknown>>) {
    return Object.keys(config).map((name) => config[name]?.paramName ?? name);
}

/**
 * A utility hook to listen to all query parameter changes. It receives a callback that will be called whenever the query parameters change.
 */
export function useOnQueryParamChange(
    callback: (val: string | undefined) => void
) {
    const storage = useSyncExternalStore(
        subscribe,
        getSnapshot,
        useCallback(() => undefined, [])
    );
    useEffect(() => {
        callback(storage);
    }, [storage]);
}

/**
 * A utility hook that listens to all query parameter changes and returns the current query string.
 */
export function useQueryString() {
    const [queryString, setQueryString] = useState<string>();
    useOnQueryParamChange(setQueryString);
    return queryString;
}

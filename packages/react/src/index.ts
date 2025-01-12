"use client";

import {
    createGetter,
    createSetter,
    getParamNames,
    getSnapshot,
    QueryParamSetting,
    subscribe,
} from "@qstate/core";

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
export function useQueryParams<
    Config extends Record<string, QueryParamSetting<any>>,
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
    const setter = useMemo(() => createSetter(config), [config]);

    const parsedValues = useMemo(
        () => createGetter(config, storage),
        [config, storage]
    );

    return [parsedValues, setter, isReady] as const;
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

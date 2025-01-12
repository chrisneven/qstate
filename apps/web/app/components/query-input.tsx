"use client";

import { booleanSettings, numberSettings, stringSettings } from "@qstate/core";
import { useQueryParam, useQueryParams } from "@qstate/react";

export function QueryInput() {
    const [query, setQuery] = useQueryParam("query", {
        ...stringSettings,
        defaultValue: "",
    });
    const [{ foo, bar }, setParams] = useQueryParams({
        foo: { ...numberSettings, defaultValue: 0 },
        bar: { ...booleanSettings, defaultValue: false },
    });

    return (
        <>
            <input value={query} onChange={(e) => setQuery(e.target.value)} />

            <input
                type="number"
                value={foo}
                onChange={(e) => setParams({ foo: Number(e.target.value) })}
            />

            <input
                type="checkbox"
                checked={bar}
                onChange={(e) => setParams({ bar: e.target.checked })}
            />
        </>
    );
}

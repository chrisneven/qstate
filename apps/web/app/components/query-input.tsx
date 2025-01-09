"use client";

import { stringSettings, useQueryParam } from "@qstate/react";

export function QueryInput() {
    const [query, setQuery] = useQueryParam("query", {
        ...stringSettings,
        defaultValue: "",
    });
    return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

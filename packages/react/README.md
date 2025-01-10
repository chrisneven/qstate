# QState React

QState React is a library for managing query parameters in React applications. It provides custom hooks to decode, encode, and manage query parameters in a type-safe manner.

## Installation

To install the react package, use npm or yarn:

```bash
npm install @qstate/react
# or
yarn add @qstate/react
```

## Usage

### Creating Query Parameter Settings

You can create settings for different types of query parameters using the provided utility functions from the core package.

```typescript
import {
    stringSettings,
    booleanSettings,
    numberSettings,
    dateSettings,
    stringArraySettings,
} from "@qstate/core";

const config = {
    search: stringSettings,
    showDetails: booleanSettings,
    page: numberSettings,
    startDate: dateSettings,
    tags: stringArraySettings,
};
```

### Using `useQueryParam` Hook

Use the `useQueryParam` hook to manage a single query parameter.

```typescript
import { useQueryParam } from "@qstate/react";

const [search, setSearch] = useQueryParam("search", stringSettings);

useEffect(() => {
    console.log(search);
}, [search]);

// To update the query parameter
setSearch("new search value");
```

### Using `useQueryParams` Hook

Use the `useQueryParams` hook to manage multiple query parameters.

```typescript
import useQueryParams from "@qstate/react";

const [queryParams, setQueryParams, isReady] = useQueryParams(config);

useEffect(() => {
    if (isReady) {
        console.log(queryParams);
    }
}, [queryParams, isReady]);

// To update multiple query parameters
setQueryParams({ search: "example", page: 2 });
```

### Subscribing to Query Parameter Changes

Use the `useOnQueryParamChange` hook to listen for query parameter changes.

```typescript
import { useOnQueryParamChange } from "@qstate/react";

useOnQueryParamChange((queryString) => {
    console.log("Query parameters changed:", queryString);
});
```

### Getting the Current Query String

Use the `useQueryString` hook to get the current query string.

```typescript
import { useQueryString } from "@qstate/react";

const queryString = useQueryString();

useEffect(() => {
    console.log("Current query string:", queryString);
}, [queryString]);
```

## API

### `useQueryParam(name, config)`

Custom hook to manage a single query parameter.

- `name`: The name of the query parameter.
- `config`: The configuration for the query parameter.

### `useQueryParams(config)`

Custom hook for managing multiple query parameters.

- `config`: The configuration object that defines the query parameters and their settings.

### `useOnQueryParamChange(callback)`

A utility hook to listen to all query parameter changes.

- `callback`: The callback function to execute when query parameters change.

### `useQueryString()`

A utility hook that listens to all query parameter changes and returns the current query string.

## License

This project is licensed under the MIT License.
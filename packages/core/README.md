# QState Core

QState Core is a library for managing query parameters in a web application. It provides utilities to decode, encode, and manage query parameters in a type-safe manner.

## Installation

To install the core package, use npm or yarn:

```bash
npm install @qstate/core
# or
yarn add @qstate/core
```

## Usage

### Creating Query Parameter Settings

You can create settings for different types of query parameters using the provided utility functions.

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

### Getting Query Parameters

Use the `createGetter` function to extract query parameters based on the provided configuration.

```typescript
import { createGetter } from "@qstate/core";

const queryParams = createGetter(config, window.location.search);
console.log(queryParams);
```

### Setting Query Parameters

Use the `createSetter` function to update query parameters based on the provided configuration.

```typescript
import { createSetter } from "@qstate/core";

const setQueryParams = createSetter(config);
setQueryParams({ search: "example", page: 2 });
```

### Subscribing to Query Parameter Changes

Use the `subscribe` function to listen for query parameter changes.

```typescript
import { subscribe } from "@qstate/core";

const unsubscribe = subscribe(() => {
    console.log("Query parameters changed");
});

// To unsubscribe
unsubscribe();
```

## API

### `createGetter(config, queryString)`

Creates a getter function that extracts query parameters based on the provided configuration.

- `config`: The configuration object defining how to decode and handle each query parameter.
- `queryString`: The query string to parse. If undefined, the current URL's query string will be used.

### `createSetter(config)`

Creates a setter function that updates query parameters based on the provided configuration.

- `config`: The configuration object defining how to encode and handle each query parameter.

### `subscribe(callback)`

Subscribes to navigation or query parameter changes and executes the provided callback function.

- `callback`: The callback function to execute when a navigation or query parameter change occurs.

### Utility Functions

- `getParamNames(config)`: Returns the parameter names from the configuration.
- `getSnapshot(names)`: Gets the current snapshot of the query params.

## License

This project is licensed under the MIT License.
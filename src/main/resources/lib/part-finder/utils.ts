import { getToolUrl } from "/lib/xp/admin";

export function forceArray<A>(data: A | Array<A> | undefined | null): Array<A>;
export function forceArray<A>(data: A | ReadonlyArray<A> | undefined | null): ReadonlyArray<A>;
export function forceArray<A>(data: A | Array<A> | undefined | null): ReadonlyArray<A> {
  data = data ?? [];
  return Array.isArray(data) ? data : [data];
}

export function notNullOrUndefined<T>(val: T | null | undefined): val is T {
  return val !== null && val !== undefined;
}

export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}

export function find<T, S extends T>(arr: T[], predicate: (value: T) => value is S): S | undefined;
export function find<T>(arr: T[], predicate: (value: T) => boolean): T | undefined;
export function find<T>(arr: T[], predicate: (value: T) => boolean): T | undefined {
  // For performance reasons we use a for-loop here, instead of array methods (see "Functional programming" in AGENTS.md)
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }

  return undefined;
}

export function difference<A, B>(xs: A[], ys: B[], predicate: (x: A, y: B) => boolean): A[] {
  return xs.filter((x) => !ys.some((y) => predicate(x, y)));
}

export function unique(arr: string[]): string[] {
  return arr.filter((value, index, all) => all.indexOf(value) === index);
}

export function objectKeys<Obj extends object>(obj: Obj): (keyof Obj)[] {
  return Object.keys(obj) as (keyof Obj)[];
}

export function startsWith(str: string, searchString: string): boolean {
  return str.substring(0, searchString.length) === searchString;
}

export function flatMap<A, B>(arr: A[], f: (val: A, index: number) => B[]): B[] {
  // For performance reasons we use a for-loop here, instead of array methods (see "Functional programming" in AGENTS.md)
  const result: B[] = [];

  for (let i = 0; i < arr.length; i++) {
    const values = f(arr[i], i);

    for (let j = 0; j < values.length; j++) {
      result.push(values[j]);
    }
  }

  return result;
}

/**
 * Creates a lookup object from a list, using `getKey` to create the key of each value. Later values with the same key
 * replace earlier ones.
 */
export function indexBy<A>(arr: A[], getKey: (val: A) => string): Record<string, A> {
  // For performance reasons we use a for-loop here, instead of array methods (see "Functional programming" in AGENTS.md)
  const result: Record<string, A> = {};

  for (let i = 0; i < arr.length; i++) {
    result[getKey(arr[i])] = arr[i];
  }

  return result;
}

/**
 * Creates an object from a list of key-value pairs (like `Object.fromEntries`, which Nashorn does not have)
 */
export function fromEntries<A>(entries: [string, A][]): Record<string, A> {
  // For performance reasons we use a for-loop here, instead of array methods (see "Functional programming" in AGENTS.md)
  const result: Record<string, A> = {};

  for (let i = 0; i < entries.length; i++) {
    result[entries[i][0]] = entries[i][1];
  }

  return result;
}

/**
 * Groups the values of a list by the key `getKey` creates for each value, keeping the order of the list in each group
 */
export function groupBy<A>(arr: A[], getKey: (val: A) => string): Record<string, A[]> {
  // For performance reasons we use a for-loop here, instead of array methods (see "Functional programming" in AGENTS.md)
  const result: Record<string, A[]> = {};

  for (let i = 0; i < arr.length; i++) {
    const key = getKey(arr[i]);
    result[key] = result[key] ?? [];
    result[key].push(arr[i]);
  }

  return result;
}

export function stringAfterLast(str: string, delimiter: string): string {
  return str.substring(str.lastIndexOf(delimiter) + 1);
}

export function getPartFinderUrl(params: Record<string, string>): string {
  const queryParams = objectKeys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return `${getToolUrl("no.item.partfinder", "part-finder")}?${queryParams}`;
}

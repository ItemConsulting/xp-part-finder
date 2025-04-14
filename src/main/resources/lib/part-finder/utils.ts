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
  for (const key in arr) {
    if (predicate(arr[key])) {
      return arr[key];
    }
  }
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

export function flatMap<A, B>(arr: A[], f: (val: A) => B[]): B[] {
  return arr.reduce<B[]>((res, val) => res.concat(f(val)), []);
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

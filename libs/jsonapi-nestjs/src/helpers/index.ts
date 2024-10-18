export const namedClass = (
  name: string,
  cls: new (...rest: unknown[]) => Record<never, unknown>,
) =>
  ({
    [name]: class extends cls {
      constructor(...arg: unknown[]) {
        super(...arg);
      }
    },
  })[name];

export function concatenatePaths(...paths: string[]): string {
  return paths
    .map((path) => path.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

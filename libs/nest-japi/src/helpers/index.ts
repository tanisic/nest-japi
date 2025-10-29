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

export function joinUrlPaths(...paths: string[]): string {
  return paths
    .map((path, index) => {
      if (index !== 0) {
        path = path.replace(/^\/+/, "");
      }
      return path.replace(/\/+$/, "");
    })
    .join("/");
}

export function snakeCase(string: string) {
  return string
    .replace(/\W+/g, " ")
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join("_");
}

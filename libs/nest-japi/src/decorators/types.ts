import { ZodObject } from "zod";
import { MethodName } from "../controller/types";

type IsUnique<T extends readonly any[], Seen extends any[] = []> = T extends [
  infer First,
  ...infer Rest,
]
  ? First extends Seen[number]
    ? false
    : IsUnique<Rest, [...Seen, First]>
  : true;

export type UniqueTuple<T extends readonly MethodName[]> =
  IsUnique<T> extends true ? T : never;

export type MetaSchemas<Disabled extends readonly MethodName[] | undefined> = {
  [K in MethodName as Disabled extends readonly MethodName[]
    ? K extends Disabled[number]
      ? never
      : K
    : K]?: {
    document?: ZodObject<any>;
    resource?: ZodObject<any>;
  };
};

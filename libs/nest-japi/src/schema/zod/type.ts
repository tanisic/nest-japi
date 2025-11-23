import { z, ZodLiteral } from "zod";
import { JsonApiSchema } from "../schema";
import { Type } from "@nestjs/common";
import { getType } from "../helpers/schema-helper";

export type ZodTypeSchema<T extends string> = ZodLiteral<T>;

export const zodTypeSchema = <T extends string>(
  resourceSchema: Type<JsonApiSchema<any>>,
) => {
  const type = getType(resourceSchema);
  return z.literal(type);
};

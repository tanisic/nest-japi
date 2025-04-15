import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { Type } from "@nestjs/common";
import { getType } from "../../helpers/schema-helper";
import { zodAttributesSchema, zodRelationsSchema } from "../common";
import { ExtractAttributes, Relationships } from "../../types";

export const jsonApiPatchInputSchema = <Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
) => {
  const type = getType(schema);
  return z
    .object({
      data: z
        .object({
          id: z.coerce.string(),
          type: z.literal(type),
          attributes: zodAttributesSchema(schema),
          relationships: zodRelationsSchema(schema),
        })
        .strip()
        .refine((obj) => obj.relationships || obj.attributes, {
          message: "At least one relationship or attribute should be present.",
        }),
    })
    .strict();
};

export type PatchBody<Schema extends BaseSchema<any>> = {
  data: {
    id: string;
    type: string;
    attributes?: ExtractAttributes<Schema>;
    relationships?: Relationships<Schema>;
  };
};

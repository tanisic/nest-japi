import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { Type } from "@nestjs/common";
import { getRelations, getType } from "../../helpers/schema-helper";
import { zodAttributesSchema, zodRelationsSchema } from "../common";
import { RelationshipData } from "../type";

export const jsonApiPostInputSchema = (schema: Type<BaseSchema<any>>) => {
  const type = getType(schema);
  return z
    .object({
      data: z
        .object({
          type: z.literal(type),
          attributes: zodAttributesSchema(schema),
          relationships: zodRelationsSchema(schema),
        })
        .strict(),
    })
    .strict();
};

export type PostBody<
  IdType,
  TType extends string,
  TAttributes extends Record<string, unknown>,
> = {
  data: {
    type: TType;
    attributes: TAttributes;
    relationships?: Record<string, RelationshipData<IdType>>;
  };
};

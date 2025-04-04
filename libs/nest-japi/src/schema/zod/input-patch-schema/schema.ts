import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { Type } from "@nestjs/common";
import { getType } from "../../helpers/schema-helper";
import { zodAttributesSchema, zodRelationsSchema } from "../common";
import { RelationshipData } from "../type";

export const jsonApiPatchInputSchema = (schema: Type<BaseSchema<any>>) => {
  const type = getType(schema);
  return z
    .object({
      data: z
        .object({
          id: z.coerce.string(),
          type: z.literal(type),
          attributes: zodAttributesSchema(schema).optional(),
          relationships: zodRelationsSchema(schema).optional(),
        })
        .strict()
        .refine((obj) => obj.relationships || obj.attributes, {
          message: "At least one relationship or attribute should be present.",
        }),
    })
    .strict();
};

export type PatchBody<
  IdType,
  TType extends string,
  TAttributes extends Record<string, unknown>,
> = {
  data: {
    id: IdType;
    type: TType;
    attributes?: TAttributes;
    relationships?: Record<string, RelationshipData<IdType>>;
  };
};

export type PatchRelationshipBody<
  IdType,
  TType extends string,
  IsMany extends boolean = false,
> = IsMany extends true
  ? {
      data: {
        id: IdType;
        type: TType;
      }[];
    }
  : {
      data: {
        id: IdType;
        type: TType;
      } | null;
    };

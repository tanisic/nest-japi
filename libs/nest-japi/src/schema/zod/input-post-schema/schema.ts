import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { Type } from "@nestjs/common";
import { getType } from "../../helpers/schema-helper";
import { zodAttributesSchema, zodRelationsSchema } from "../common";
import { ExtractAttributes, Relationships } from "../../types";

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

export type PostBody<Schema extends BaseSchema<any>> = {
  data: {
    type: string;
    attributes: ExtractAttributes<Schema>;
    relationships?: Relationships<Schema>;
  };
};

import { z, ZodRawShape } from "zod";

import { BaseSchema } from "../../base-schema";
import { Type } from "@nestjs/common";
import { zodTypeSchema } from "../type";
import {
  getAttributeByName,
  getAttributes,
  getRelations,
  getType,
} from "../../helpers/schema-helper";

const zodDataSchema = (schema: Type<BaseSchema<any>>) => {
  const idField = getAttributeByName(schema, "id");
  return z
    .object({
      id: z.number(),
      // id: idField.validate,
      type: zodTypeSchema(schema),
    })
    .strict();
};

const zodRelationsSchema = (schema: Type<BaseSchema<any>>) => {
  const relations = getRelations(schema);

  const shape = relations.reduce((shape, relation) => {
    const relationSchema = relation.schema();
    const dataSchema = zodDataSchema(relationSchema);

    // Add the relation to the shape accumulator
    shape[relation.name] = z
      .object({
        data: relation.many
          ? dataSchema.strict().array()
          : dataSchema.strict().nullable(),
      })
      .strict()
      .optional();

    return shape;
  }, {} as ZodRawShape);

  return z.object(shape).strict().optional();
};

const zodAttributesSchema = (schema: Type<BaseSchema<any>>) => {
  const attributes = getAttributes(schema);

  let shape = {};
  for (const attribute of attributes) {
    if (attribute.name === "id") continue;
    if (!attribute.validate)
      throw new Error(
        `${schema.name}: Missing 'validate' property on attribute '${schema.name}.${attribute.name}'.`,
      );

    shape = { ...shape, [attribute.name]: attribute.validate };
  }

  return z.object(shape).strict();
};

export const jsonApiPatchInputSchema = (schema: Type<BaseSchema<any>>) => {
  const type = getType(schema);
  return z
    .object({
      data: z
        .object({
          id: z.number().or(z.string()),
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

type RelationshipLinkage<IdType> = { type: string; id: IdType };

type RelationshipData<IdType = string | number> = {
  data: RelationshipLinkage<IdType>[] | RelationshipLinkage<IdType> | null;
};
export type PatchBody<
  IdType,
  TType extends string,
  TAttributes extends Record<string, unknown>,
> = {
  data: {
    type: TType;
    attributes?: TAttributes;
    relationships?: Record<string, RelationshipData<IdType>>;
  };
};

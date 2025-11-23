import { z } from "zod";

import { JsonApiSchema } from "../../schema";
import { NotFoundException, Type } from "@nestjs/common";
import {
  getAttributeByName,
  getRelationByName,
  getType,
} from "../../helpers/schema-helper";
import { ExtractRelations, Relationships } from "../../types";

export const jsonApiPatchRelationInputSchema = <
  TSchema extends JsonApiSchema<any>,
  RelationName extends keyof ExtractRelations<TSchema>,
>(
  parentSchema: Type<TSchema>,
  relationName: RelationName,
) => {
  const relation = getRelationByName(parentSchema, relationName);

  if (!relation) {
    throw new NotFoundException(
      `Relation ${relationName as string} does not exist on ${parentSchema.name}.`,
    );
  }

  const relationSchema = relation.schema() as Type<JsonApiSchema<any>>;
  const relationType = getType(relationSchema);
  const relationIdField = getAttributeByName(relationSchema, "id");
  if (!relationIdField) {
    throw new NotFoundException(
      `Id field does not exist on ${parentSchema.name}.`,
    );
  }
  const dataSchema = z
    .object({
      id: z.coerce.string(),
      type: z.literal(relationType),
    })
    .strict();
  return z
    .object({
      data: relation.many ? z.array(dataSchema) : dataSchema.nullable(),
    })
    .strict();
};

export const jsonApiPatchRelationInputSwaggerSchema = () => {
  const dataSchema = z
    .object({
      id: z.string(),
      type: z.string(),
    })
    .strict();
  return z
    .object({
      data: z.array(dataSchema).or(dataSchema.nullable()),
    })
    .strict();
};

export type PatchRelationship<
  TSchema extends JsonApiSchema<any>,
  RelName extends
    keyof ExtractRelations<TSchema> = keyof ExtractRelations<TSchema>,
> = Relationships<TSchema>[RelName];

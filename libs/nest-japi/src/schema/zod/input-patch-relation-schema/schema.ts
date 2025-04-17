import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { NotFoundException, Type } from "@nestjs/common";
import {
  getAttributeByName,
  getRelationByName,
  getType,
} from "../../helpers/schema-helper";
import { ExtractRelations, Relationships } from "../../types";

export const jsonApiPatchRelationInputSchema = <Schema extends BaseSchema<any>>(
  parentSchema: Type<Schema>,
  relationName: string,
) => {
  // @ts-expect-error
  const relation = getRelationByName(parentSchema, relationName);
  if (!relation) {
    throw new NotFoundException(
      `Relation ${relationName} does not exist on ${parentSchema.name}.`,
    );
  }

  const relationSchema = relation.schema();
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
  Schema extends BaseSchema<any>,
  RelName extends keyof ExtractRelations<Schema>,
> = Relationships<Schema>[RelName];

import { z } from "zod";

import { BaseSchema } from "../../base-schema";
import { NotFoundException, Type } from "@nestjs/common";
import {
  getAttributeByName,
  getRelationByName,
  getType,
} from "../../helpers/schema-helper";

export const jsonApiPatchRelationInputSchema = (
  parentSchema: Type<BaseSchema<any>>,
  relationName: string,
) => {
  const idField = getAttributeByName(parentSchema, "id");
  if (!idField) {
    throw new Error(`Id field does not exist on ${parentSchema.name}.`);
  }
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
      id: relationIdField.validate,
      type: z.literal(relationType),
    })
    .strict();
  return z
    .object({
      data: relation.many
        ? z.array(dataSchema).nullable()
        : dataSchema.nullable(),
    })
    .strict();
};

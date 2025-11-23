import { NotFoundException, Type } from "@nestjs/common";
import { JsonApiSchema } from "../../schema";
import { z } from "zod";
import {
  getRelationByName,
  getType,
  getAttributeByName,
} from "../../helpers/schema-helper";
import { ExtractRelations } from "../../types";
import { relationshipsLinkSchema } from "../common";

export const jsonApiResponseGetRelationshipDataZodSchema = <
  Schema extends JsonApiSchema<any>,
>(
  parentSchema: Type<Schema>,
  relationName: keyof ExtractRelations<Schema>,
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

  const singleData = z
    .object({
      id: z.coerce.string(),
      type: z.literal(relationType),
    })
    .strict();

  const dataSchema = relation.many
    ? z.array(singleData)
    : singleData.nullable();

  return z.object({ links: relationshipsLinkSchema, data: dataSchema });
};

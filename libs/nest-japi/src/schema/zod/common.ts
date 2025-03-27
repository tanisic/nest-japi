import { z, ZodRawShape, ZodTypeAny } from "zod";
import {
  getAttributeByName,
  getAttributes,
  getRelations,
} from "../helpers/schema-helper";
import { Type } from "@nestjs/common";
import { BaseSchema } from "../base-schema";
import { zodTypeSchema } from "./type";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
extendZodWithOpenApi(z);

export const zodDataSchema = (schema: Type<BaseSchema<any>>) => {
  const idField = getAttributeByName(schema, "id");
  if (!idField) {
    throw new Error(`Id field does not exist on ${schema.name}.`);
  }
  return z
    .object({
      id: idField.validate,
      type: zodTypeSchema(schema),
    })
    .strict();
};

export const zodRelationsSchema = (schema: Type<BaseSchema<any>>) => {
  const relations = getRelations(schema);

  const shape = relations.reduce((shape, relation) => {
    const relationSchema = relation.schema();
    const dataSchema = zodDataSchema(relationSchema);

    shape[relation.name] = z
      .object({
        data: relation.many
          ? dataSchema.strict().array()
          : dataSchema.strict().nullable(),
      })
      .strict()
      .optional();

    if (relation.openapi) {
      shape[relation.name] = shape[relation.name].openapi({
        ...relation.openapi,
      });
    }

    return shape;
  }, {} as ZodRawShape);

  return z.object(shape).strict().optional();
};

export const zodRelationsSchemaWithLinksAndData = (
  schema: Type<BaseSchema<any>>,
) => {
  const relations = getRelations(schema);

  const shape = relations.reduce((shape, relation) => {
    const relationSchema = relation.schema();
    const dataSchema = zodDataSchema(relationSchema);

    shape[relation.name] = z
      .object({
        data: relation.many
          ? dataSchema.strict().array()
          : dataSchema.strict().nullable(),
        links: relationshipsLinkSchema,
      })
      .strict()
      .optional();

    if (relation.openapi) {
      shape[relation.name] = shape[relation.name].openapi({
        ...relation.openapi,
      });
    }

    return shape;
  }, {} as ZodRawShape);

  return z.object(shape).strict().optional();
};

export const zodAttributesSchema = (schema: Type<BaseSchema<any>>) => {
  const attributes = getAttributes(schema);

  let shape = {};
  for (const attribute of attributes) {
    if (attribute.name === "id") continue;
    if (!attribute.validate)
      throw new Error(
        `${schema.name}: Missing 'validate' property on attribute '${schema.name}.${attribute.name}'.`,
      );

    shape = { ...shape, [attribute.name]: attribute.validate };

    if (attribute.openapi) {
      shape[attribute.name] = shape[attribute.name].openapi({
        ...attribute.openapi,
      });
    }
  }

  return z.object(shape).strict();
};

export const jsonApiVersionSchema = z.object({
  version: z.string().default("1.0"),
});

export const metaSchema = z.object({}).optional();

export const paginationLinksSchema = z
  .object({
    first: z.string(),
    last: z.string(),
    next: z.string().nullable(),
    prev: z.string().nullable(),
  })
  .optional();

export const topLevelSelfLinkSchema = z.object({ self: z.string() }).optional();
export const documentLevelLinkSchema = z
  .object({ self: z.string() })
  .optional();
export const relationshipsLinkSchema = z
  .object({ self: z.string(), related: z.string() })
  .optional();

export const fullJsonApiResponseSchema = (
  schema: Type<BaseSchema<any>>,
  {
    withPagination = false,
    topLevelMetaSchema = metaSchema,
    dataArray = true,
    hasIncludes = false,
  }: {
    withPagination?: boolean;
    dataArray?: boolean;
    hasIncludes?: boolean;
    topLevelMetaSchema?: ZodTypeAny;
  },
) => {
  const dataObjectSchema = z
    .object({
      attributes: zodAttributesSchema(schema),
      links: documentLevelLinkSchema,
      relationships: zodRelationsSchemaWithLinksAndData(schema),
    })
    .merge(zodDataSchema(schema));

  const includedDataObjectSchema = z.object({
    id: z.string().or(z.number()),
    type: z.string(),
    attributes: z.object({}).optional(),
    relationships: z.object({}).optional(),
    links: documentLevelLinkSchema,
  });

  let baseDocumentSchema = z.object({
    jsonapi: jsonApiVersionSchema,
    links: withPagination ? paginationLinksSchema : topLevelSelfLinkSchema,
    meta: topLevelMetaSchema,
    data: dataArray ? z.array(dataObjectSchema) : dataObjectSchema,
  });

  if (hasIncludes) {
    baseDocumentSchema = baseDocumentSchema.extend({
      included: z.array(includedDataObjectSchema).optional(),
    });
  }

  return baseDocumentSchema;
};

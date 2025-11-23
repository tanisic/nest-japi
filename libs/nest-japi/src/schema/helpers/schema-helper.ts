import { Type } from "@nestjs/common";
import {
  JSONAPI_SCHEMA_RELATIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
  JSONAPI_SCHEMA_TYPE,
  JSONAPI_RESOURCE_SCHEMAS,
  JSONAPI_SCHEMA_ENTITY_CLASS,
  JSONAPI_RESOURCE_OPTIONS,
} from "../../constants";
import { SchemaAttribute } from "../../decorators/attribute.decorator";
import { RelationAttribute } from "../../decorators/relation.decorator";
import { JsonApiSchema } from "../schema";
import {
  ExtractAttributes,
  ExtractRelations,
  InferEntity,
  InferSchemas,
  ViewSchema,
} from "../types";
import { ResourceOptions } from "../../decorators/resource.decorator";
import { type JsonApiController } from "../../controller/base-controller";

export function getRelations<TSchema extends JsonApiSchema<any>>(
  schema: Type<TSchema>,
): RelationAttribute<TSchema, keyof ExtractRelations<TSchema>, boolean>[] {
  const relations =
    Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, schema.prototype) || [];
  return relations;
}

export function getRelationByName<
  TSchema extends JsonApiSchema<any>,
  RelationName extends keyof ExtractRelations<TSchema>,
>(schema: Type<TSchema>, name: RelationName) {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.name === name) as
    | RelationAttribute<TSchema, RelationName>
    | undefined;
}

export function getRelationByDataKey<
  TSchema extends JsonApiSchema<any>,
  DataKey extends keyof InferEntity<TSchema>,
>(schema: Type<TSchema>, name: DataKey) {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.dataKey === name);
}

export function getAttributes<TSchema extends JsonApiSchema<any>>(
  schema: Type<TSchema>,
): SchemaAttribute<TSchema>[] {
  const attributes =
    Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, schema.prototype) || [];
  return attributes;
}

export function getAttributeByName<
  TSchema extends JsonApiSchema<any>,
  AttributeKey extends keyof ExtractAttributes<TSchema>,
>(schema: Type<TSchema>, name: AttributeKey) {
  const attributes = getAttributes(schema);
  return attributes.find((attribute) => attribute.name === name) as
    | SchemaAttribute<TSchema, AttributeKey>
    | undefined;
}

export function getAttributeByDataKey<
  TSchema extends JsonApiSchema<any>,
  DataKey extends keyof InferEntity<TSchema>,
>(schema: Type<TSchema>, name: DataKey) {
  const attributes = getAttributes(schema);
  // @ts-expect-error
  return attributes.find((attribute) => attribute.dataKey === name) as
    | SchemaAttribute<TSchema, keyof ExtractAttributes<TSchema>, DataKey>
    | undefined;
}

export function getType<TSchema extends JsonApiSchema<any>>(
  schema: Type<TSchema>,
): string {
  const type = Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, schema);

  if (!type) {
    throw new Error(`JSON:API type is not defiend on ${schema.name}.`);
  }

  return type;
}

export function getEntityFromSchema<TSchema extends JsonApiSchema<any>>(
  schema: Type<TSchema>,
): Type<InferEntity<TSchema>> {
  const entity = Reflect.getMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, schema);
  return entity;
}

export function getSchemasFromResource<
  TResource extends JsonApiController,
  TSchemas extends InferSchemas<TResource> = InferSchemas<TResource>,
>(resource: Type<TResource>): { schema: Type<ViewSchema<TSchemas>> } {
  const schemas = Reflect.getMetadata(JSONAPI_RESOURCE_SCHEMAS, resource);
  return schemas;
}
export function getResourceOptions(
  resource: Type<JsonApiController>,
): ResourceOptions {
  const schemas = Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, resource);
  return schemas;
}

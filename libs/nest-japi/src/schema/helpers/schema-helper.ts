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
import { BaseSchema } from "../base-schema";
import { InferEntity, Schemas } from "../types";
import { EntityClass } from "@mikro-orm/core";
import { ResourceOptions } from "../../decorators/resource.decorator";
import { JsonBaseController } from "../../controller/base-controller";

export function getRelations<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
): RelationAttribute<Schema>[] {
  const relations =
    Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, schema.prototype) || [];
  return relations;
}

export function getRelationByName<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
  name: string,
): RelationAttribute<Schema> | undefined {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.name === name);
}

export function getRelationByDataKey<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
  name: string,
): RelationAttribute<Schema> | undefined {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.name === name);
}

export function getAttributes<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
): SchemaAttribute<Schema>[] {
  const attributes =
    Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, schema.prototype) || [];
  return attributes;
}

export function getAttributeByName<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
  name: string,
): SchemaAttribute<Schema> | undefined {
  const attributes = getAttributes(schema);
  return attributes.find((attribute) => attribute.name === name);
}

export function getAttributeByDataKey<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
  name: string,
): SchemaAttribute<Schema> | undefined {
  const attributes = getAttributes(schema);
  return attributes.find((attribute) => attribute.dataKey === name);
}

export function getType<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
): string {
  const type = Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, schema);

  if (!type) {
    throw new Error(`JSON:API type is not defiend on ${schema.name}.`);
  }

  return type;
}

export function getEntityFromSchema<Schema extends BaseSchema<any>>(
  schema: Type<Schema>,
): EntityClass<InferEntity<Schema>> {
  const entity = Reflect.getMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, schema);
  return entity;
}

export function getSchemasFromResource(
  resource: Type<JsonBaseController>,
): Schemas {
  const schemas = Reflect.getMetadata(JSONAPI_RESOURCE_SCHEMAS, resource);
  return schemas;
}
export function getResourceOptions(
  resource: Type<JsonBaseController>,
): ResourceOptions {
  const schemas = Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, resource);
  return schemas;
}

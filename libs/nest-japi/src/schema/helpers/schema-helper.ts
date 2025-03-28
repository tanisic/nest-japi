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
import { Schemas } from "../types";
import { EntityClass } from "@mikro-orm/core";
import { ResourceOptions } from "../../decorators/resource.decorator";
import { JsonBaseController } from "../../controller/base-controller";

export function getRelations(
  schema: Type<BaseSchema<any>>,
): RelationAttribute[] {
  const relations =
    Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, schema.prototype) || [];
  return relations;
}

export function getRelationByName(
  schema: Type<BaseSchema<any>>,
  name: string,
): RelationAttribute | undefined {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.name === name);
}

export function getRelationByDataKey(
  schema: Type<BaseSchema<any>>,
  name: string,
): RelationAttribute | undefined {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.name === name);
}

export function getAttributes(
  schema: Type<BaseSchema<any>>,
): SchemaAttribute[] {
  const attributes =
    Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, schema.prototype) || [];
  return attributes;
}

export function getAttributeByName(
  schema: Type<BaseSchema<any>>,
  name: string,
): SchemaAttribute | undefined {
  const attributes = getAttributes(schema);
  return attributes.find((attribute) => attribute.name === name);
}

export function getAttributeByDataKey(
  schema: Type<BaseSchema<any>>,
  name: string,
): SchemaAttribute | undefined {
  const attributes = getAttributes(schema);
  return attributes.find((attribute) => attribute.dataKey === name);
}

export function getType(schema: Type<BaseSchema<any>>): string {
  const type = Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, schema);

  if (!type) {
    throw new Error(`JSON:API type is not defiend on ${schema.name}.`);
  }

  return type;
}

export function getEntityFromSchema(
  schema: Type<BaseSchema<any>>,
): EntityClass<any> {
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

import { Type } from "@nestjs/common";
import {
  JSONAPI_SCHEMA_RELATIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
  JSONAPI_SCHEMA_TYPE,
  JSONAPI_RESOURCE_SCHEMAS,
  JSONAPI_SCHEMA_ENTITY_CLASS,
} from "../../constants";
import { SchemaAttribute } from "../../decorators/attribute.decorator";
import { RelationAttribute } from "../../decorators/relation.decorator";
import { BaseSchema } from "../base-schema";
import { BaseResource } from "../../resource/base-resource";
import { Schemas } from "../types";
import { EntityClass } from "@mikro-orm/core";

export function getRelations(
  schema: Type<BaseSchema<any>>,
): RelationAttribute[] {
  const relations =
    Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, schema.prototype) || [];
  return relations;
}

export function getRelation(
  schema: Type<BaseSchema<any>>,
  name: string,
): RelationAttribute | undefined {
  const relations = getRelations(schema);
  return relations.find((relation) => relation.dataKey === name);
}

export function getAttributes(
  schema: Type<BaseSchema<any>>,
): SchemaAttribute[] {
  const attributes =
    Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, schema.prototype) || [];
  return attributes;
}

export function getAttribute(
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

export function getSchemasFromResource(resource: Type<BaseResource>): Schemas {
  const schemas = Reflect.getMetadata(JSONAPI_RESOURCE_SCHEMAS, resource);
  return schemas;
}

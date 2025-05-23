import { JSONAPI_SCHEMA_ENTITY_CLASS, JSONAPI_SCHEMA_TYPE } from "../constants";
import { EntityClass } from "@mikro-orm/core";
import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import { InferEntity } from "../schema";

export interface SchemaOptions<Entity> {
  entity: EntityClass<Entity>;
  jsonapiType: string;
}

export const Schema = <Schema extends BaseSchema<any>>(
  options: SchemaOptions<InferEntity<Schema>>,
) => {
  return (target: Type<Schema>) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(BaseSchema, target)) {
      throw new Error(
        `${target.name}: Must extend ${BaseSchema.name} class to be valid schema.`,
      );
    }

    Reflect.defineMetadata(JSONAPI_SCHEMA_TYPE, options.jsonapiType, target);
    Reflect.defineMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, options.entity, target);
  };
};

import { JSONAPI_SCHEMA_ENTITY_CLASS, JSONAPI_SCHEMA_TYPE } from "../constants";
import { EntityClass } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";

export interface SchemaOptions {
  entity: EntityClass<unknown>;
  jsonapiType: string;
}

export const Schema = (options: SchemaOptions): ClassDecorator => {
  return (target: Function) => {
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

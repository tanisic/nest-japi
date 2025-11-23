import { JSONAPI_SCHEMA_ENTITY_CLASS, JSONAPI_SCHEMA_TYPE } from "../constants";
import { Injectable, Type } from "@nestjs/common";
import { JsonApiSchema as SchemaClass } from "../schema/schema";
import { InferEntity } from "../schema";

export interface SchemaOptions<Entity> {
  entity: Type<Entity>;
  jsonapiType: string;
}

export const Schema = <TSchema extends SchemaClass<any>>(
  options: SchemaOptions<InferEntity<TSchema>>,
) => {
  return (target: Type<TSchema>) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(Schema, target)) {
      throw new Error(
        `${target.name}: Must extend ${Schema.name} class to be valid schema.`,
      );
    }

    Reflect.defineMetadata(JSONAPI_SCHEMA_TYPE, options.jsonapiType, target);
    Reflect.defineMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, options.entity, target);
  };
};

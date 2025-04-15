import {
  JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
} from "../constants";
import { EntityKey } from "@mikro-orm/core";
import { type SchemaObject } from "openapi3-ts/oas31";
import { ZodTypeAny } from "zod";
import { BaseSchema, InferEntity } from "../schema";

export type AttributeOptions<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
> = {
  /**
   * Map this property to another entity attribute.
   *
   * @default property name
   *
   * */
  dataKey?: EntityKey<Entity>;
  openapi?: Partial<SchemaObject>;
  validate: ZodTypeAny;
};

export type SchemaAttribute<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
> = Required<AttributeOptions<Schema, Entity>> & {
  name: string;
};

export function Attribute<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
>(options: AttributeOptions<Schema>): PropertyDecorator {
  return (target, propertyKey) => {
    const opts: AttributeOptions<Schema> = {
      dataKey: propertyKey as EntityKey<Entity>,
      ...options,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
      opts,
      target,
      propertyKey,
    );

    const restAttributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, target) || [];

    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTES,
      [...restAttributes, { name: propertyKey, ...opts }],
      target,
    );
  };
}

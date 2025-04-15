import {
  JSONAPI_SCHEMA_RELATION_OPTIONS,
  JSONAPI_SCHEMA_RELATIONS,
} from "../constants";
import { EntityKey } from "@mikro-orm/core";
import { BaseSchema } from "../schema/base-schema";
import { Type } from "@nestjs/common";
import { type SchemaObject } from "openapi3-ts/oas31";
import { InferEntity } from "../schema";

export type RelationOptions<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
> = {
  /**
   * Map this property to another entity relation.
   *
   * @default property name
   *
   * */
  dataKey?: EntityKey<Entity>;

  /**
   *
   * Connected schema that describes relation
   */
  schema: () => Type<BaseSchema<any>>;

  /**
   * Is relation required on PATCH and POST?
   * @default false
   */
  required?: boolean;

  /**
   * Is relation belongs to or to many?
   * @default false
   */
  many?: boolean;
  /**
   * Write your own openapi documentation about this relation.
   */
  openapi?: Partial<SchemaObject>;
};

export type RelationAttribute<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
> = Required<RelationOptions<Schema, Entity>> & { name: string };

export function Relation<
  Schema extends BaseSchema<any>,
  Entity = InferEntity<Schema>,
>(options: RelationOptions<Schema, Entity>): PropertyDecorator {
  return (target, propertyKey) => {
    const opts: RelationOptions<Schema, Entity> = {
      ...{ required: false, many: false, ...options },
      dataKey: propertyKey as EntityKey<Entity>,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_RELATION_OPTIONS,
      opts,
      target,
      propertyKey,
    );

    const restAttributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, target) || [];

    Reflect.defineMetadata(
      JSONAPI_SCHEMA_RELATIONS,
      [...restAttributes, { name: propertyKey, ...opts }],
      target,
    );
  };
}

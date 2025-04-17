import {
  JSONAPI_SCHEMA_RELATION_OPTIONS,
  JSONAPI_SCHEMA_RELATIONS,
} from "../constants";
import { BaseSchema } from "../schema/base-schema";
import { Type } from "@nestjs/common";
import { type SchemaObject } from "openapi3-ts/oas31";
import { ExtractRelations, InferEntity } from "../schema";

export type RelationSchemaDef<
  Schema extends BaseSchema<any>,
  RelationKey extends keyof ExtractRelations<Schema>,
> = () => Schema[RelationKey] extends Array<infer U>
  ? U extends BaseSchema<any>
    ? Type<U>
    : never
  : Type<Schema[RelationKey]>;

export type RelationOptions<
  Schema extends BaseSchema<any>,
  isMany extends boolean,
  RelationKey extends keyof ExtractRelations<Schema>,
  DataKey = keyof InferEntity<Schema>,
> = {
  /**
   * Map this relation to another entity relation.
   * @default relation name
   */
  dataKey?: DataKey;

  /**
   *
   * Connected schema that describes relation
   */
  schema: () => Schema[RelationKey] extends Array<infer U>
    ? U extends BaseSchema<any>
      ? Type<U>
      : never
    : Schema[RelationKey] extends BaseSchema<any>
      ? Type<Schema[RelationKey]>
      : never;
  /**
   * Is relation required on PATCH and POST?
   * @default false
   */
  required?: boolean;

  /**
   * Write your own openapi documentation about this relation.
   */
  openapi?: Partial<SchemaObject>;
} & (isMany extends true
  ? ToManyRelationAttribute
  : BelongsToRelationAttribute);

export type ToManyRelationAttribute = {
  /**
   * Is relation belongs to or to many?
   * @default false
   */
  many: true;
};

export type BelongsToRelationAttribute = {
  /**
   * Is relation belongs to or to many?
   * @default false
   */
  many?: false;

  /**
   * Works only on `many: false` relations
   * @default false
   */
  nullable?: boolean;
};

export type RelationAttribute<
  Schema extends BaseSchema<any>,
  isMany extends boolean,
  RelationKey extends keyof ExtractRelations<Schema>,
> = Required<RelationOptions<Schema, isMany, RelationKey>> & {
  name: RelationKey;
};

export function Relation<
  Schema extends BaseSchema<any>,
  RelationKey extends keyof ExtractRelations<Schema>,
>(
  options: RelationOptions<
    Schema,
    Schema[RelationKey] extends Array<any> ? true : false,
    RelationKey
  >,
) {
  return (target: Schema, propertyKey: RelationKey) => {
    const opts: RelationOptions<
      Schema,
      Schema[RelationKey] extends Array<any> ? true : false,
      RelationKey
    > = {
      ...{ required: false, many: false, nullable: false, ...options },
      dataKey: propertyKey,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_RELATION_OPTIONS,
      opts,
      target,
      propertyKey as string,
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

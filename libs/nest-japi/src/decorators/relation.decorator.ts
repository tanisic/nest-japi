import {
  JSONAPI_SCHEMA_RELATION_OPTIONS,
  JSONAPI_SCHEMA_RELATIONS,
} from "../constants";
import { JsonApiSchema } from "../schema/schema";
import { Type } from "@nestjs/common";
import { type SchemaObject } from "openapi3-ts/oas31";
import {
  ExtractRelations,
  HasMany,
  HasOne,
  InferEntity,
  InferIsMany,
} from "../schema";

export type RelationSchemaDef<
  TSchema extends JsonApiSchema<any>,
  RelationKey extends keyof ExtractRelations<TSchema>,
> = () => TSchema[RelationKey] extends HasMany<infer U>
  ? Type<U>
  : TSchema[RelationKey] extends HasOne<infer Y>
    ? Type<Y>
    : never;

export type RelationOptions<
  TSchema extends JsonApiSchema<any>,
  RelationKey extends keyof ExtractRelations<TSchema>,
  IsMany extends boolean = InferIsMany<TSchema, RelationKey>,
  DataKey extends keyof InferEntity<TSchema> = keyof InferEntity<TSchema>,
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
  schema: RelationSchemaDef<TSchema, RelationKey>;
  /**
   * Is relation required on PATCH and POST?
   * @default false
   */
  required?: boolean;

  /**
   * Write your own openapi documentation about this relation.
   */
  openapi?: Partial<SchemaObject>;
} & (IsMany extends true
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
  TSchema extends JsonApiSchema<any>,
  RelationKey extends
    keyof ExtractRelations<TSchema> = keyof ExtractRelations<TSchema>,
  IsMany extends boolean = InferIsMany<TSchema, RelationKey>,
  DataKey extends keyof InferEntity<TSchema> = keyof InferEntity<TSchema>,
> = Required<RelationOptions<TSchema, RelationKey, IsMany, DataKey>> & {
  name: RelationKey;
};

export function Relation<
  TSchema extends JsonApiSchema<any>,
  RelationKey extends keyof ExtractRelations<TSchema>,
>(options: RelationOptions<TSchema, RelationKey>) {
  return (target: TSchema, propertyKey: RelationKey) => {
    const opts: RelationOptions<TSchema, RelationKey> = {
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

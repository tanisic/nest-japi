import { Type } from "@nestjs/common";
import { JsonApiSchema } from "./schema";
import { EntityClass } from "@mikro-orm/core";
import { type JsonApiController } from "../controller/base-controller";

export type SchemaTypes = "createSchema" | "updateSchema" | "schema";

export type Schemas<
  ViewSchema extends JsonApiSchema<any>,
  CreateSchema extends JsonApiSchema<any> = ViewSchema,
  UpdateSchema extends JsonApiSchema<any> = ViewSchema,
> = {
  createSchema?: Type<CreateSchema>;
  updateSchema?: Type<UpdateSchema>;
  schema: Type<ViewSchema>;
};

export type ViewSchema<TSchemas extends Schemas<any, any, any>> =
  TSchemas extends Schemas<infer V, any, any> ? V : never;

export type CreateSchema<TSchemas extends Schemas<any, any, any>> =
  TSchemas extends Schemas<any, infer V, any> ? V : never;

export type UpdateSchema<TSchemas extends Schemas<any, any, any>> =
  TSchemas extends Schemas<any, any, infer V> ? V : never;

export type Entity<IdType extends string | number = any> = Record<
  string,
  any
> & {
  id: IdType;
};

export type Entities = {
  createEntity?: Type<EntityClass<any>>;
  updateEntity?: Type<EntityClass<any>>;
  viewEntity: Type<EntityClass<any>>;
};

export type RelationshipLinkage<IdType = string> = { type: string; id: IdType };

export type Relationships<
  TSchema extends JsonApiSchema<any>,
  Relations extends ExtractRelations<TSchema> = ExtractRelations<TSchema>,
> = {
  [K in keyof Relations]: {
    data: Relations[K] extends HasMany<any>
      ? RelationshipLinkage[]
      : RelationshipLinkage | null;
  };
};

export type InferSchemas<T> =
  T extends JsonApiController<any, any, infer TSchemas> ? TSchemas : never;

const __hasMany = Symbol("Relationship hasMany symbol");

export type HasOne<TSchema extends JsonApiSchema<any>> = TSchema & {
  [__hasMany]: false;
};

export type HasMany<TSchema extends JsonApiSchema<any>> = TSchema & {
  [__hasMany]: true;
};

export type IsRelation<T> = T extends { [__hasMany]: boolean } ? true : false;
export type IsHasMany<T> = T extends { [__hasMany]: true } ? true : false;
export type IsHasOne<T> = T extends { [__hasMany]: false } ? true : false;

export type ExtractRelations<TSchema extends JsonApiSchema<any>> = {
  [K in keyof TSchema as IsRelation<TSchema[K]> extends true
    ? K
    : never]: TSchema[K];
};

export type RelationKeys<TSchema extends JsonApiSchema<any>> = {
  [K in keyof ExtractRelations<TSchema>]: K;
}[keyof ExtractRelations<TSchema>];

export type ExtractAttributes<TSchema extends JsonApiSchema<any>> = {
  [K in keyof TSchema as IsRelation<TSchema[K]> extends true
    ? never
    : K]: TSchema[K];
};

export type ExtractHasOneRelations<TSchema extends JsonApiSchema<any>> = {
  [K in keyof TSchema as IsHasOne<TSchema[K]> extends true
    ? K
    : never]: TSchema[K];
};

export type ExtractHasManyRelations<TSchema extends JsonApiSchema<any>> = {
  [K in keyof TSchema as IsHasMany<TSchema[K]> extends true
    ? K
    : never]: TSchema[K];
};

export type InferEntity<TSchema, OverrideEntity = never> =
  TSchema extends JsonApiSchema<infer TEntity> ? TEntity : OverrideEntity;

export type InferIsMany<
  TSchema extends JsonApiSchema<any>,
  RelationKey extends
    keyof ExtractRelations<TSchema> = keyof ExtractRelations<TSchema>,
> = ExtractRelations<TSchema>[RelationKey] extends { [__hasMany]: true }
  ? true
  : false;

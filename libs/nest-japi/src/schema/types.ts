import { Type } from "@nestjs/common";
import { BaseSchema } from "./base-schema";
import { EntityClass } from "@mikro-orm/core";

export type SchemaTypes = "createSchema" | "updateSchema" | "schema";

export type Schemas = {
  createSchema?: Type<BaseSchema<any>>;
  updateSchema?: Type<BaseSchema<any>>;
  schema: Type<BaseSchema<any>>;
};

export type Entities = {
  createEntity?: Type<EntityClass<any>>;
  updateEntity?: Type<EntityClass<any>>;
  viewEntity: Type<EntityClass<any>>;
};

export type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint;

export type ExtractAttributes<T> = {
  [K in keyof T as T[K] extends Primitive
    ? K
    : T[K] extends Array<any>
      ? never
      : T[K] extends object
        ? T[K] extends BaseSchema<any>
          ? never
          : K
        : K]: T[K];
};

export type ExtractRelations<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : T[K] extends Array<Function> | object
      ? K
      : never]: T[K];
};

export type RelationshipLinkage<IdType = string> = { type: string; id: IdType };

export type Relationships<
  Schema extends BaseSchema<any>,
  Relations = ExtractRelations<Schema>,
> = {
  [K in keyof Relations]: {
    data: Relations[K] extends Array<any>
      ? RelationshipLinkage[]
      : RelationshipLinkage | null;
  };
};

export type InferEntity<Schema, OverrideEntity = never> =
  Schema extends BaseSchema<infer Entity> ? Entity : OverrideEntity;

import { Type } from "@nestjs/common";
import { BaseSchema } from "./base-schema";
import { EntityClass } from "@mikro-orm/core";
import { JsonBaseController } from "../controller/base-controller";

export type SchemaTypes = "createSchema" | "updateSchema" | "schema";

export type Schemas<
  ViewSchema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> = {
  createSchema?: Type<CreateSchema>;
  updateSchema?: Type<UpdateSchema>;
  schema: Type<ViewSchema>;
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

type IsWritable<T, K extends keyof T> = { -readonly [P in K]: T[P] } extends {
  [P in K]: T[P];
}
  ? true
  : false;

export type ExtractAttributes<T> = {
  [K in keyof T as IsWritable<T, K> extends true
    ? T[K] extends Primitive
      ? K
      : T[K] extends Array<any>
        ? never
        : T[K] extends object
          ? T[K] extends BaseSchema<any>
            ? never
            : K extends keyof BaseSchema<any>
              ? never
              : K
          : K
    : never]: T[K];
};

export type ExtractRelations<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : T[K] extends Array<any> | object
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

export type InferSchemas<T> =
  T extends JsonBaseController<
    any,
    any,
    infer ViewSchema,
    infer CreateSchema,
    infer UpdateSchema
  >
    ? {
        ViewSchema: ViewSchema;
        CreateSchema: CreateSchema;
        UpdateSchema: UpdateSchema;
      }
    : never;

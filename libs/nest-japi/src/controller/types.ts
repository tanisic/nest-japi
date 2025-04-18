import { PipeTransform, RequestMethod } from "@nestjs/common";
import { NestInterceptor, Type } from "@nestjs/common/interfaces";
import { InferEntity, Schemas } from "../schema/types";
import { BaseSchema } from "../schema/base-schema";
import { SwaggerMethodImplementation } from "../swagger";
import { EntityManager } from "@mikro-orm/core";

export type MethodName =
  | "getAll"
  | "getOne"
  | "getRelationship"
  | "getRelationshipData"
  | "deleteOne"
  | "postOne"
  | "patchOne"
  | "patchRelationship";

type MapNameToTypeMethod = {
  getAll: RequestMethod.GET;
  getOne: RequestMethod.GET;
  patchOne: RequestMethod.PATCH;
  patchRelationship: RequestMethod.PATCH;
  postOne: RequestMethod.POST;
  deleteOne: RequestMethod.DELETE;
  getRelationship: RequestMethod.GET;
  getRelationshipData: RequestMethod.GET;
};

export interface PipeMixinParams {
  schema: Type<BaseSchema<any>>;
}

export type PipeMixin = (params: PipeMixinParams) => PipeTransform;

export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  schema: keyof Schemas<any, any, any>;
  implementation: any[T];
  swaggerImplementation?: SwaggerMethodImplementation;
  pipes?: (Type<PipeTransform> | PipeTransform)[];
  interceptors?: (NestInterceptor | Function)[];
  parameters: {
    decorator: (
      property?: string,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ) => ParameterDecorator;
    property?: string;
    mixins?: PipeMixin[];
  }[];
}

export type BindingsConfig = {
  [Key in MethodName]: Binding<Key>;
};

export type ControllerMethods = { [k in MethodName]: (...arg: any[]) => any };

export type ControllerGenerics<
  Id extends string | number = string | number,
  TEntityManager extends EntityManager = EntityManager,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
  ViewEntity = InferEntity<ViewSchema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> = {
  Id: Id;
  TEntityManager: TEntityManager;
  ViewSchema: ViewSchema;
  CreateSchema: CreateSchema;
  UpdateSchema: UpdateSchema;
  ViewEntity: ViewEntity;
  CreateEntity: CreateEntity;
  UpdateEntity: UpdateEntity;
};

export type InferControllerGenerics<T> = T extends {
  __generics: ControllerGenerics;
}
  ? T["__generics"]
  : never;

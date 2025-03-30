import { PipeTransform, RequestMethod } from "@nestjs/common";
import { Type } from "@nestjs/common/interfaces";
import { Schemas } from "../schema/types";
import { BaseSchema } from "../schema/base-schema";
import { SwaggerMethodImplementation } from "../swagger";

export type MethodName =
  | "getAll"
  | "getOne"
  | "getRelationship"
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
};

export interface PipeMixinParams {
  schema: Type<BaseSchema<any>>;
}

export type PipeMixin = (params: PipeMixinParams) => PipeTransform;

export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  schema: keyof Schemas;
  implementation: any[T];
  swaggerImplementation?: SwaggerMethodImplementation;
  pipes?: (Type<PipeTransform> | PipeTransform)[];
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

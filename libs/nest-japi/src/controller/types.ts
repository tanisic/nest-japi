import { PipeTransform, RequestMethod } from "@nestjs/common";
import { NestInterceptor, Type } from "@nestjs/common/interfaces";
import { Schemas } from "../schema/types";
import { JsonApiSchema } from "../schema/schema";
import { ResourceOptions } from "../decorators/resource.decorator";

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
  schema: Type<JsonApiSchema<any>>;
  options: ResourceOptions<any>;
}

export type PipeMixin = (params: PipeMixinParams) => PipeTransform | undefined;

export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  schema: keyof Schemas<any, any, any>;
  implementation: any[T];
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

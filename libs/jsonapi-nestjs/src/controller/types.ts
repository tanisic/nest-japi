import { PipeTransform, RequestMethod } from "@nestjs/common";
import { Type } from "@nestjs/common/interfaces";
import { Schemas } from "../schema/types";

export type MethodName =
  | "getAll"
  | "getOne"
  | "getRelationship"
  | "deleteOne"
  | "deleteRelationship"
  | "postOne"
  | "postRelationship"
  | "patchOne"
  | "patchRelationship";

type MapNameToTypeMethod = {
  getAll: RequestMethod.GET;
  getOne: RequestMethod.GET;
  patchOne: RequestMethod.PATCH;
  patchRelationship: RequestMethod.PATCH;
  postOne: RequestMethod.POST;
  postRelationship: RequestMethod.POST;
  deleteOne: RequestMethod.DELETE;
  deleteRelationship: RequestMethod.DELETE;
  getRelationship: RequestMethod.GET;
};

export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  schema: keyof Schemas;
  implementation: any[T];
  parameters: {
    decorator: (
      property?: string,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ) => ParameterDecorator;
    property?: string;
    mixins: any[];
  }[];
}

export type BindingsConfig = {
  [Key in MethodName]: Binding<Key>;
};

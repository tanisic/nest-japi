import {
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { MethodName } from "../controller/types";
import { Injectable, Type } from "@nestjs/common";
import { Schemas } from "../schema/types";
import { snakeCase } from "es-toolkit";
import {
  InferControllerGenerics,
  JsonBaseController,
} from "../controller/base-controller";
import { BaseSchema } from "../schema";

type AreUnique<
  T extends readonly string[],
  Seen extends string[] = [],
> = T extends [infer First extends string, ...infer Rest extends string[]]
  ? First extends Seen[number]
    ? false
    : AreUnique<Rest, [...Seen, First]>
  : true;

type UniqueTuple<T extends readonly MethodName[]> =
  AreUnique<T> extends true ? T : ["❌ Duplicate methods are not allowed"];

export interface ResourceOptions<
  DisabledMethods extends readonly MethodName[],
  ViewSchema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> {
  schemas: Schemas<ViewSchema, CreateSchema, UpdateSchema>;
  path?: string;
  disabledMethods?: UniqueTuple<DisabledMethods>;
  maxPaginationSize?: number;
}

export const Resource = <
  Resource extends object,
  Generics extends InferControllerGenerics<Resource>,
  DisabledMethods extends readonly MethodName[],
>(
  options: ResourceOptions<
    DisabledMethods,
    Generics["ViewSchema"],
    Generics["CreateSchema"],
    Generics["UpdateSchema"]
  >,
) => {
  return (target: Type<Resource>) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(JsonBaseController, target)) {
      throw new Error(
        `${target.name}: Must extend ${JsonBaseController.name} class to be valid resource.`,
      );
    }

    const opts: ResourceOptions<
      DisabledMethods,
      Generics["ViewSchema"],
      Generics["CreateSchema"],
      Generics["UpdateSchema"]
    > = {
      path: snakeCase(target.name),
      ...options,
    };

    Reflect.defineMetadata(JSONAPI_RESOURCE_SCHEMAS, opts.schemas, target);
    Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, opts, target);
  };
};

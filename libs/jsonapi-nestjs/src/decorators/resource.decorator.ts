import {
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { MethodName } from "../controller/types";
import { Injectable } from "@nestjs/common";
import { Schemas } from "../schema/types";
import { BaseResource } from "../resource/base-resource";
import { snakeCase } from "es-toolkit";

export interface ResourceOptions {
  schemas: Schemas;
  path?: string;
  disabledMethods?: ReadonlyArray<MethodName>;
  maxPaginationSize?: number;
}

export const Resource = (options: ResourceOptions): ClassDecorator => {
  return (target: Function) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(BaseResource, target)) {
      throw new Error(
        `${target.name}: Must extend ${BaseResource.name} class to be valid resource.`,
      );
    }

    const opts: ResourceOptions = {
      path: snakeCase(target.name),
      ...options,
    };

    Reflect.defineMetadata(JSONAPI_RESOURCE_SCHEMAS, opts.schemas, target);

    if (options) {
      Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, opts, target);
    }
  };
};

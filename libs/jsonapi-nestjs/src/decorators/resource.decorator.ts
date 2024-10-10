import { snakeCase } from "es-toolkit";
import { JSONAPI_RESOURCE_OPTIONS, JSONAPI_RESOURCE_TYPE } from "../constants";
import { BaseResource } from "../resource/base-resource";
import { MethodName } from "../controller/types";

export interface ResourceOptions {
  jsonapiType?: string;
  path?: string;
  disabledMethods?: MethodName[];
}

export const Resource = (options?: ResourceOptions): ClassDecorator => {
  return (target: Function) => {
    if (!Object.prototype.isPrototypeOf.call(BaseResource, target)) {
      throw new Error(
        `${target.name}: Must extend ${BaseResource.name} class to be valid resource.`,
      );
    }

    Reflect.defineMetadata(
      JSONAPI_RESOURCE_TYPE,
      options?.jsonapiType || snakeCase(target.name),
      target,
    );

    if (options) {
      Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, options, target);
    }
  };
};

import { JSONAPI_RESOURCE_OPTIONS } from "../modules/constants";
import { BaseResource } from "../resource/base-resource";

export interface ResourceOptions {
  jsonapiType?: string;
  path?: string;
  disabledMethods?: any[];
}

export const Resource = (options?: ResourceOptions): ClassDecorator => {
  return (target: Function) => {
    if (!Object.prototype.isPrototypeOf.call(BaseResource, target)) {
      throw new Error(
        `${target.name}: Must extend ${BaseResource.name} class to be valid resource.`,
      );
    }

    if (options) {
      Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, options, target);
    }
  };
};

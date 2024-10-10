import { Type, Controller } from "@nestjs/common";
import { ResourceOptions } from "../decorators/resource.decorator";
import { JSONAPI_RESOURCE_OPTIONS } from "../constants";
import { BaseResource } from "../resource/base-resource";
import { snakeCase } from "es-toolkit";

export const namedClass = (
  name: string,
  cls: new (...rest: unknown[]) => Record<never, unknown>,
) =>
  ({
    [name]: class extends cls {
      constructor(...arg: unknown[]) {
        super(...arg);
      }
    },
  })[name];

export function createController(resource: Type<BaseResource>) {
  if (!Object.prototype.isPrototypeOf.call(BaseResource, resource)) {
    throw new Error(
      `${resource.name}: Must extend ${BaseResource.name} class to be valid resource.`,
    );
  }

  const ControllerClass = resource;

  const options: ResourceOptions | undefined = Reflect.getMetadata(
    JSONAPI_RESOURCE_OPTIONS,
    ControllerClass,
  );

  Controller(options?.path || snakeCase(ControllerClass.name))(ControllerClass);
  return ControllerClass;
}

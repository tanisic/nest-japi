import {
  Type,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  RequestMethod,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ResourceOptions } from "../decorators/resource.decorator";
import { JSONAPI_RESOURCE_OPTIONS } from "../constants";
import { BaseResource } from "../resource/base-resource";
import { snakeCase } from "es-toolkit";
import { MethodName } from "../controller/types";
import { controllerBindings } from "../controller/controller-bindings";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";

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

export const namedFunction = (name: string, fn: (...rest: unknown[]) => any) =>
  ({
    [name]: fn,
  })[name];
const allowedMethods: MethodName[] = [
  "getAll",
  "postOne",
  "getOne",
  "patchOne",
  "patchRelationship",
  "postRelationship",
  "deleteOne",
  "getRelationship",
  "deleteRelationship",
];

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

  for (const methodName of allowedMethods) {
    if (options.disabledMethods?.includes(methodName)) continue;
    const { name, path, parameters, method, implementation } =
      controllerBindings[methodName];

    if (
      !Object.prototype.hasOwnProperty.call(ControllerClass.prototype, name)
    ) {
      const fn = function (
        ...arg: Parameters<typeof implementation>
      ): ReturnType<typeof implementation> {
        return this.constructor.__proto__.prototype[name].call(this, ...arg);
      };

      Object.defineProperty(fn, "name", { value: name, writable: false });

      Reflect.defineProperty(ControllerClass.prototype, name, {
        value: fn,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(
      ControllerClass.prototype,
      name,
    );
    if (!descriptor) {
      throw new Error(
        `Descriptor for "${ControllerClass.name}[${name}]" is undefined`,
      );
    }

    switch (method) {
      case RequestMethod.GET: {
        Get(path)(ControllerClass.prototype, name, descriptor);
        break;
      }
      case RequestMethod.DELETE: {
        HttpCode(204)(ControllerClass.prototype, name, descriptor);
        Delete(path)(ControllerClass.prototype, name, descriptor);
        break;
      }
      case RequestMethod.POST: {
        Post(path)(ControllerClass.prototype, name, descriptor);
        break;
      }
      case RequestMethod.PATCH: {
        Patch(path)(ControllerClass.prototype, name, descriptor);
        break;
      }
      default: {
        throw new Error(`Method '${method}' unsupported`);
      }
    }
    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      ControllerClass.prototype.constructor,
      name,
    );

    for (const paramKey in parameters) {
      const parameter = parameters[paramKey];
      const { property, decorator, mixins } = parameter;

      if (paramsMetadata) {
        let typeDecorator: RouteParamtypes;
        switch (decorator) {
          case Query:
            typeDecorator = RouteParamtypes.QUERY;
            break;
          case Param:
            typeDecorator = RouteParamtypes.PARAM;
            break;
          case Body:
            typeDecorator = RouteParamtypes.BODY;
        }
        // TODO: Inject pipes missing
        const tmp = Object.entries(paramsMetadata)
          .filter(([k, v]) => k.split(":").at(0) === typeDecorator.toString())
          .reduce(
            (acum, [k, v]) => (acum.push(...(v as any).pipes), acum),
            [] as any,
          );

        // resultMixin.push(...tmp);
      }
      decorator(property)(
        ControllerClass.prototype,
        name,
        parseInt(paramKey, 10),
      );
    }
  }

  Controller(options?.path || snakeCase(ControllerClass.name))(ControllerClass);
  return ControllerClass;
}

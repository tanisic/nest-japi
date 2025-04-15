import {
  type Type,
  RequestMethod,
  Get,
  Delete,
  Post,
  Patch,
  Query,
  Param,
  Body,
  Controller,
  UseFilters,
  Injectable,
  UsePipes,
  UseInterceptors,
} from "@nestjs/common";
import {
  PARAMTYPES_METADATA,
  ROUTE_ARGS_METADATA,
} from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import {
  CURRENT_METHOD_SCHEMA,
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { ResourceOptions } from "../decorators/resource.decorator";
import { controllerBindings } from "./controller-bindings";
import { Binding, MethodName } from "./types";
import { ApiExtraModels } from "@nestjs/swagger";
import { Schemas } from "../schema/types";
import { JsonApiExceptionFilter } from "../exceptions/jsonapi-error.filter";
import { JsonApiContentTypeInterceptor } from "../interceptors/content-type.interceptor";
import { HttpExceptionFilter } from "../exceptions/http-error.filter";
import { MikroOrmExceptionFilter } from "../exceptions/mikro-orm-error.filter";
import { ZodIssuesExceptionFilter } from "../exceptions/zod-issues.filter";
import { JsonBaseController } from "./base-controller";
import { FilterOperatorsSwagger } from "../swagger/filter-operators";

const allowedMethods: MethodName[] = [
  "getAll",
  "postOne",
  "getOne",
  "patchOne",
  "patchRelationship",
  "deleteOne",
  "getRelationship",
  "getRelationshipData",
];

@Injectable()
export class ControllerFactory {
  private resource: Type<JsonBaseController>;
  private controllerClass: Type<JsonBaseController>;
  private options: Required<ResourceOptions>;

  constructor(resource: Type<JsonBaseController>) {
    this.validateResource(resource);
    this.resource = resource;
    this.controllerClass = resource;
    this.options = this.getResourceOptions();
  }

  private validateResource(resource: Type<JsonBaseController>): void {
    if (!Object.prototype.isPrototypeOf.call(JsonBaseController, resource)) {
      throw new Error(
        `${resource.name}: Must extend ${JsonBaseController.name} class to be a valid resource.`,
      );
    }
  }

  private getResourceOptions(): Required<ResourceOptions> {
    return Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, this.resource);
  }

  public createController() {
    this.bindMethods();
    ApiExtraModels(FilterOperatorsSwagger)(this.controllerClass.prototype);
    this.applyControllerDecorator();
    return this.controllerClass;
  }

  private bindMethods(): void {
    for (const methodName of allowedMethods) {
      if (this.isMethodDisabled(methodName)) continue;
      this.defineControllerMethod(methodName);
      this.bindRouteMethod(methodName);
      this.bindParameters(methodName);
    }
  }

  private isMethodDisabled(methodName: MethodName): boolean {
    return this.options?.disabledMethods?.includes(methodName) || false;
  }

  private defineControllerMethod(methodName: MethodName): void {
    const { name, implementation, schema } = controllerBindings[methodName];

    if (
      !Object.prototype.hasOwnProperty.call(
        this.controllerClass.prototype,
        name,
      )
    ) {
      const fn = function (
        ...arg: Parameters<typeof implementation>
      ): ReturnType<typeof implementation> {
        // @ts-expect-error
        return this.constructor.__proto__.prototype[name].call(this, ...arg);
      };

      Object.defineProperty(fn, "name", { value: name, writable: false });

      Reflect.defineProperty(this.controllerClass.prototype, name, {
        value: fn,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      this.bindSchemaToControllerMethod(controllerBindings[methodName]);
    }
  }

  private bindSchemaToControllerMethod(binding: Binding<any>) {
    const schemas = Reflect.getMetadata(
      JSONAPI_RESOURCE_SCHEMAS,
      this.controllerClass,
    );

    Reflect.defineMetadata(
      CURRENT_METHOD_SCHEMA,
      schemas.schema,
      this.controllerClass.prototype,
      binding.name,
    );
  }

  private getControllerSchemas(): Schemas {
    const schemas = Reflect.getMetadata(
      JSONAPI_RESOURCE_SCHEMAS,
      this.controllerClass,
    ) as Schemas;
    return schemas;
  }

  private getSchemaFromControllerMethod(methodName: MethodName) {
    const binding = controllerBindings[methodName];
    const schemas = this.getControllerSchemas();
    return schemas[binding.schema] || schemas["schema"];
  }

  private bindRouteMethod(methodName: MethodName): void {
    const {
      name,
      path,
      method,
      pipes,
      swaggerImplementation,
      interceptors = [],
    } = controllerBindings[methodName];
    const descriptor = Reflect.getOwnPropertyDescriptor(
      this.controllerClass.prototype,
      name,
    );

    if (!descriptor) {
      throw new Error(
        `Descriptor for "${this.controllerClass.name}[${name}]" is undefined`,
      );
    }

    if (swaggerImplementation) {
      const schemas = this.getControllerSchemas();
      swaggerImplementation({
        resource: this.controllerClass.prototype,
        descriptor,
        schemas,
      });
    }

    switch (method) {
      case RequestMethod.GET:
        Get(path)(this.controllerClass.prototype, name, descriptor);
        break;
      case RequestMethod.DELETE:
        Delete(path)(this.controllerClass.prototype, name, descriptor);
        break;
      case RequestMethod.POST:
        Post(path)(this.controllerClass.prototype, name, descriptor);
        break;
      case RequestMethod.PATCH:
        Patch(path)(this.controllerClass.prototype, name, descriptor);
        break;
      default:
        throw new Error(`Method '${method}' unsupported`);
    }

    UseInterceptors(JsonApiContentTypeInterceptor, ...interceptors)(
      this.controllerClass.prototype,
      name,
      descriptor,
    );

    if (pipes) {
      UsePipes(...pipes)(this.controllerClass.prototype, name, descriptor);
    }
  }

  private bindParameters(methodName: MethodName): void {
    const { name, parameters } = controllerBindings[methodName];
    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      this.controllerClass.prototype.constructor,
      name,
    );

    const schema = this.getSchemaFromControllerMethod(methodName);

    for (const paramKey in parameters) {
      const parameter = parameters[paramKey]!;
      const { property, decorator, mixins = [] } = parameter;

      const resolvedPipes = mixins.map((mixin) => mixin({ schema }));

      if (paramsMetadata) {
        this.injectPipesIfNeeded(paramsMetadata, decorator);
      }

      decorator(property, ...resolvedPipes)(
        this.controllerClass.prototype,
        name,
        parseInt(paramKey, 10),
      );

      Reflect.defineMetadata(
        PARAMTYPES_METADATA,
        [Object],
        this.controllerClass.prototype,
        name,
      );
    }
  }

  private injectPipesIfNeeded(paramsMetadata: any, decorator: any): void {
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
        break;
    }
  }

  private applyControllerDecorator(): void {
    UseFilters(
      JsonApiExceptionFilter,
      HttpExceptionFilter,
      MikroOrmExceptionFilter,
      ZodIssuesExceptionFilter,
    )(this.controllerClass);
    Controller(this.options.path)(this.controllerClass);
  }
}

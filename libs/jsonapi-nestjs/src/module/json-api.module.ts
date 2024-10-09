import { Controller, Global, Module } from "@nestjs/common";
import type {
  DynamicModule,
  ModuleMetadata,
  Type,
  ValueProvider,
} from "@nestjs/common";
import { JSONAPI_RESOURCES } from "./constants";
import { BaseResource } from "../resource/base-resource";

export interface JsonApiModuleOptions {
  resources: Type<BaseResource>[];
}

@Global()
@Module({})
export class JsonApiModule {
  static forRoot(options: JsonApiModuleOptions): DynamicModule {
    const resources = JsonApiModule.resourcesProvider(options.resources);

    const controllers: Type<any>[] = [];

    for (const resource of options.resources) {
      const controller = createController(resource);
      controllers.push(controller);
    }

    return {
      module: JsonApiModule,
      providers: [resources],
      exports: [resources],
      controllers,
    };
  }

  static resourcesProvider(
    resources: Type<BaseResource>[],
  ): ValueProvider<Type<BaseResource>[]> {
    return {
      provide: JSONAPI_RESOURCES,
      useValue: resources,
    };
  }
}

interface JsonApiResourceModuleOptions extends ModuleMetadata {
  resource: Type<BaseResource>;
}

@Module({})
export class JsonApiResourceModule {
  static forRoot(options: JsonApiResourceModuleOptions): DynamicModule {
    return { module: JsonApiResourceModule, ...options };
  }
}

function createController(resource: Type<BaseResource>) {
  if (!Object.prototype.isPrototypeOf.call(BaseResource, resource)) {
    throw new Error(
      `${resource.name}: Must extend ${BaseResource.name} class to be valid resource.`,
    );
  }

  const controllerClass = resource;

  Controller(controllerClass.name.toLowerCase())(controllerClass);

  return controllerClass;
}

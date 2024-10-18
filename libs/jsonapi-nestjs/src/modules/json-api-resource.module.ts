import {
  Type,
  DynamicModule,
  FactoryProvider,
  ValueProvider,
  Logger,
} from "@nestjs/common";
import { namedClass } from "../helpers";
import { BaseResource } from "../resource/base-resource";
import {
  JSONAPI_DECORATOR_OPTIONS,
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
  CURRENT_SCHEMAS,
} from "../constants";
import { JsonApiOptions } from "./json-api-options";
import { JsonApiModuleOptions } from "./json-api.module";
import { ResourceOptions } from "../decorators/resource.decorator";
import { Schemas } from "../schema/types";
import { ControllerFactory } from "../controller/controller-factory";
import { SerializerService } from "../serializer/serializer.service";
import { PaginateService, QueryAllPipe } from "../query";
import { includeServiceProvider } from "../query/providers/include.provider";
import { sortServiceProvider } from "../query/providers/sort.provider";
import { sparseFieldsServiceProvider } from "../query/providers/sparse-fields.provider";
import { QueryOnePipe } from "../query/pipes/query-one.pipe";
import { getSchemasFromResource } from "../schema";

export interface JsonApiResourceModuleOptions {
  resource: Type<BaseResource>;
}

export class JsonApiResourceModule {
  static forRoot(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource } = options;

    const controllerFactory = new ControllerFactory(resource);
    const ResourceClass = controllerFactory.createController();

    const schemas: Schemas = getSchemasFromResource(ResourceClass);

    const schemasProvider: ValueProvider<Schemas> = {
      provide: CURRENT_SCHEMAS,
      useValue: schemas,
    };

    const resourceOptionsProvider: ValueProvider<ResourceOptions> = {
      provide: JSONAPI_RESOURCE_OPTIONS,
      useValue: Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, ResourceClass),
    };

    const allOptionsProvider: FactoryProvider<JsonApiOptions> = {
      provide: JsonApiOptions,
      inject: [JSONAPI_DECORATOR_OPTIONS, JSONAPI_RESOURCE_OPTIONS],
      useFactory: (global: JsonApiModuleOptions, resource: ResourceOptions) =>
        new JsonApiOptions({ global, resource }),
    };

    const module = namedClass(
      `JsonApi${ResourceClass.name}Module`,
      JsonApiResourceModule,
    );

    const logger = new Logger(module.name);
    logger.log(`JSON:API Resource ${ResourceClass.name} initialized`);

    return {
      module,
      providers: [
        resourceOptionsProvider,
        allOptionsProvider,
        schemasProvider,
        SerializerService,
        includeServiceProvider,
        sparseFieldsServiceProvider,
        sortServiceProvider,
        QueryAllPipe,
        QueryOnePipe,
        PaginateService,
      ],
      controllers: [ResourceClass],
    };
  }
}

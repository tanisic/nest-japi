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
import { PaginateService, QueryPipe } from "../query";
import { SortService } from "../query/services/sort.service";
import { SparseFieldsService } from "../query/services/sparse-fields.service";

export interface JsonApiResourceModuleOptions {
  resource: Type<BaseResource>;
}

export class JsonApiResourceModule {
  static forRoot(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource } = options;

    const controllerFactory = new ControllerFactory(resource);
    const ResourceClass = controllerFactory.createController();

    const schemas: Schemas = Reflect.getMetadata(
      JSONAPI_RESOURCE_SCHEMAS,
      ResourceClass,
    );

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

    const sortServiceProvider: FactoryProvider<SortService> = {
      provide: SortService,
      inject: [CURRENT_SCHEMAS],
      useFactory: (schemas: Schemas) => {
        return new SortService(schemas.schema);
      },
    };

    const sparseFieldsServiceProvider: FactoryProvider<SparseFieldsService> = {
      provide: SparseFieldsService,
      inject: [JsonApiOptions],
      useFactory: (options: JsonApiOptions) => {
        return new SparseFieldsService(options);
      },
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
        sparseFieldsServiceProvider,
        sortServiceProvider,
        QueryPipe,
        PaginateService,
      ],
      controllers: [ResourceClass],
    };
  }
}

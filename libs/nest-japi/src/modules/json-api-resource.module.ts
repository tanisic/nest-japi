import {
  Type,
  DynamicModule,
  FactoryProvider,
  ValueProvider,
  Logger,
} from "@nestjs/common";
import { namedClass } from "../helpers";
import {
  JSONAPI_GLOBAL_OPTIONS,
  JSONAPI_RESOURCE_OPTIONS,
  CURRENT_SCHEMAS,
  CURRENT_MODELS,
  JSONAPI_SCHEMA_ENTITY_CLASS,
} from "../constants";
import { JsonApiOptions } from "./json-api-options";
import { JsonApiModuleOptions } from "./json-api.module";
import { ResourceOptions } from "../decorators/resource.decorator";
import { Entities, Schemas } from "../schema/types";
import { ControllerFactory } from "../controller/controller-factory";
import { SerializerService } from "../serializer/serializer.service";
import { PaginateService, QueryAllPipe } from "../query";
import { includeServiceProvider } from "../query/providers/include.provider";
import { sortServiceProvider } from "../query/providers/sort.provider";
import { sparseFieldsServiceProvider } from "../query/providers/sparse-fields.provider";
import { QueryOnePipe } from "../query/pipes/query-one.pipe";
import { getSchemasFromResource, SchemaBuilderService } from "../schema";
import { DataLayerService } from "../data-layer/data-layer.service";
import { filterServiceProvider } from "../query/providers/filter.provider";
import { JsonBaseController } from "../controller/base-controller";

export interface JsonApiResourceModuleOptions {
  resource: Type<JsonBaseController>;
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

    const modelsProvider: FactoryProvider<Entities> = {
      provide: CURRENT_MODELS,
      inject: [CURRENT_SCHEMAS],
      useFactory: (schemas: Schemas) => {
        const viewEntity = Reflect.getMetadata(
          JSONAPI_SCHEMA_ENTITY_CLASS,
          schemas.schema,
        );
        const createEntity = schemas.createSchema
          ? Reflect.getMetadata(
              JSONAPI_SCHEMA_ENTITY_CLASS,
              schemas.createSchema,
            )
          : viewEntity;
        const updateEntity = schemas.updateSchema
          ? Reflect.getMetadata(
              JSONAPI_SCHEMA_ENTITY_CLASS,
              schemas.updateSchema,
            )
          : viewEntity;
        return { viewEntity, updateEntity, createEntity };
      },
    };

    const resourceOptionsProvider: ValueProvider<ResourceOptions> = {
      provide: JSONAPI_RESOURCE_OPTIONS,
      useValue: Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, ResourceClass),
    };

    const allOptionsProvider: FactoryProvider<JsonApiOptions> = {
      provide: JsonApiOptions,
      inject: [JSONAPI_GLOBAL_OPTIONS, JSONAPI_RESOURCE_OPTIONS],
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
        modelsProvider,
        SerializerService,
        includeServiceProvider,
        filterServiceProvider,
        sparseFieldsServiceProvider,
        sortServiceProvider,
        QueryAllPipe,
        QueryOnePipe,
        PaginateService,
        DataLayerService,
        SchemaBuilderService,
      ],
      controllers: [ResourceClass],
    };
  }
}

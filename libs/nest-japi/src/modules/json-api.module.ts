import { Global, Inject, Logger, Module } from "@nestjs/common";
import type {
  DynamicModule,
  FactoryProvider,
  MiddlewareConsumer,
  ModuleMetadata,
  NestModule,
  Type,
  ValueProvider,
} from "@nestjs/common";
import {
  CURRENT_MODELS,
  CURRENT_SCHEMAS,
  JSONAPI_GLOBAL_OPTIONS,
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_SCHEMA_ENTITY_CLASS,
  SCHEMA_REPOSITORY,
  JSONAPI_RESOURCE_REGISTRY,
} from "../constants";
import { EntityManager, MikroORM } from "@mikro-orm/core";
import { RequestIdMiddleware } from "../middlewares/request-id.middleware";
import {
  BaseSchema,
  Entities,
  getSchemasFromResource,
  SchemaBuilderService,
  Schemas,
} from "../schema";
import { JsonBaseController } from "../controller/base-controller";
import { ModuleExplorerService } from "./services/module-explorer.service";
import { JsonApiBodyParserMiddleware } from "../middlewares/bodyparser.middleware";
import { ControllerFactory } from "../controller/controller-factory";
import { DataLayerService } from "../data-layer/data-layer.service";
import { ResourceOptions } from "../decorators";
import { namedClass } from "../helpers";
import {
  includeServiceProvider,
  filterServiceProvider,
  sparseFieldsServiceProvider,
  sortServiceProvider,
  QueryAllPipe,
  QueryOnePipe,
  PaginateService,
} from "../query";
import { SerializerService } from "../serializer/serializer.service";
import { JsonApiOptions } from "./json-api-options";
import { SchemaRegistryService } from "./services/schema-registry.service";
import { JsonApiResourceExplorerService } from "./services/resource-explorer.service";

export interface JsonApiModuleOptions
  extends Omit<ModuleMetadata, "controllers"> {
  maxPaginationSize?: number;
  baseUrl: string;
}

export interface JsonApiResourceModuleOptions {
  resource: Type<JsonBaseController>;
}

@Global()
@Module({})
export class JsonApiModule implements NestModule {
  @Inject(ModuleExplorerService) private moduleExplorer!: ModuleExplorerService;

  configure(consumer: MiddlewareConsumer) {
    const controllers = this.moduleExplorer.getControllersFromModule(
      JsonApiModule.name,
    );
    consumer
      .apply(RequestIdMiddleware, JsonApiBodyParserMiddleware)
      .forRoutes(...controllers);
  }

  static forRoot(options: JsonApiModuleOptions): DynamicModule {
    const globalOptionsProvider: ValueProvider<JsonApiModuleOptions> = {
      provide: JSONAPI_GLOBAL_OPTIONS,
      useValue: options,
    };

    const entityManagerProvider: FactoryProvider<EntityManager> = {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em.fork(),
      inject: [MikroORM],
    };

    const schemaRepositoryProvider: FactoryProvider<
      Map<string, Type<BaseSchema<any>>>
    > = {
      provide: SCHEMA_REPOSITORY,
      useFactory: (schemaRegistry: SchemaRegistryService) =>
        schemaRegistry.getSchemaMap(),
      inject: [SchemaRegistryService],
    };

    const resourceRepositoryProvider: FactoryProvider = {
      provide: JSONAPI_RESOURCE_REGISTRY,
      useFactory: () => new Set<Type<JsonBaseController>>(),
    };

    const imports = [...(options.imports ?? [])];
    const providers = [
      ModuleExplorerService,
      globalOptionsProvider,
      entityManagerProvider,
      schemaRepositoryProvider,
      resourceRepositoryProvider,
      JsonApiResourceExplorerService,
      SchemaRegistryService,
      ...(options.providers ?? []),
    ];

    const exports = [...providers, ...(options.exports ?? [])];

    return {
      module: JsonApiModule,
      providers,
      imports,
      exports,
    };
  }

  static forFeature(options: JsonApiResourceModuleOptions): DynamicModule {
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

    const registerResourceProvider: FactoryProvider<void> = {
      provide: `REGISTER_JSONAPI_RESOURCE_${ResourceClass.name}`,
      useFactory: (registry: Set<Type<JsonBaseController>>) => {
        registry.add(ResourceClass);
      },
      inject: [JSONAPI_RESOURCE_REGISTRY],
    };

    const module = namedClass(
      `JsonApi${ResourceClass.name}Module`,
      JsonApiModule,
    );

    const logger = new Logger(module!.name);
    logger.log(`JSON:API Resource ${ResourceClass.name} initialized`);

    return {
      module: module!,
      providers: [
        registerResourceProvider,
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

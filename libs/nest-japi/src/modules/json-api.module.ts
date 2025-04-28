import { Global, Inject, Logger, Module } from "@nestjs/common";
import type {
  DynamicModule,
  FactoryProvider,
  MiddlewareConsumer,
  ModuleMetadata,
  NestModule,
  Provider,
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

export interface JsonApiResourceModuleOptions
  extends Omit<ModuleMetadata, "controllers"> {
  resource: Type<JsonBaseController>;
}

type AsyncOptions<T> = {
  useFactory: (...args: any[]) => Promise<T> | T;
  inject?: any[];
  imports?: any[];
};

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
    const optionsProvider: ValueProvider<JsonApiModuleOptions> = {
      provide: JSONAPI_GLOBAL_OPTIONS,
      useValue: options,
    };

    return this.buildRootModule({
      imports: options.imports ?? [],
      providers: [optionsProvider, ...(options.providers ?? [])],
      exports: [
        optionsProvider,
        ...(options.providers ?? []),
        ...(options.exports ?? []),
      ],
    });
  }

  static forRootAsync(
    options: AsyncOptions<JsonApiModuleOptions>,
  ): DynamicModule {
    const optionsProvider: Provider = {
      provide: JSONAPI_GLOBAL_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return this.buildRootModule({
      imports: options.imports ?? [],
      providers: [optionsProvider],
      exports: [],
    });
  }

  private static buildRootModule(
    config: Omit<ModuleMetadata, "controller">,
  ): DynamicModule {
    const entityManagerProvider: FactoryProvider<EntityManager> = {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em.fork(),
      inject: [MikroORM],
    };

    const schemaRepositoryProvider: FactoryProvider<Map<string, Type<any>>> = {
      provide: SCHEMA_REPOSITORY,
      useFactory: (schemaRegistry: SchemaRegistryService) =>
        schemaRegistry.getSchemaMap(),
      inject: [SchemaRegistryService],
    };

    const resourceRegistryProvider: FactoryProvider<
      Set<Type<JsonBaseController>>
    > = {
      provide: JSONAPI_RESOURCE_REGISTRY,
      useFactory: () => new Set<Type<JsonBaseController>>(),
    };

    const coreProviders: Provider[] = [
      ModuleExplorerService,
      entityManagerProvider,
      schemaRepositoryProvider,
      resourceRegistryProvider,
      JsonApiResourceExplorerService,
      SchemaRegistryService,
    ];

    return {
      module: JsonApiModule,
      imports: config.imports,
      providers: [...coreProviders, ...(config.providers ?? [])],
      exports: [...coreProviders, ...(config.exports ?? [])],
    };
  }

  static forFeature(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource, imports, exports, providers } = options;
    const controllerFactory = new ControllerFactory(resource);
    const ResourceClass = controllerFactory.createController();

    const schemas: Schemas<any, any, any> =
      getSchemasFromResource(ResourceClass);

    const schemasProvider: ValueProvider<Schemas<any, any, any>> = {
      provide: CURRENT_SCHEMAS,
      useValue: schemas,
    };

    const modelsProvider: FactoryProvider<Entities> = {
      provide: CURRENT_MODELS,
      inject: [CURRENT_SCHEMAS],
      useFactory: (schemas: Schemas<any, any, any>) => {
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

    const resourceOptionsProvider: ValueProvider<
      ResourceOptions<any, any, any>
    > = {
      provide: JSONAPI_RESOURCE_OPTIONS,
      useValue: Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, ResourceClass),
    };

    const allOptionsProvider: FactoryProvider<JsonApiOptions<any, any, any>> = {
      provide: JsonApiOptions,
      inject: [JSONAPI_GLOBAL_OPTIONS, JSONAPI_RESOURCE_OPTIONS],
      useFactory: (
        global: JsonApiModuleOptions,
        resource: ResourceOptions<any, any, any>,
      ) => new JsonApiOptions({ global, resource }),
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
      imports: imports || [],
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
        ...(providers || []),
      ],
      exports: exports || [],
      controllers: [ResourceClass],
    };
  }
}

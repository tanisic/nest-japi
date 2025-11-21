import { Global, Inject, Logger, Module } from "@nestjs/common";
import type {
  DynamicModule,
  ExistingProvider,
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
  JSONAPI_SERVICE_REGISTRY,
  JSONAPI_SERVICE,
} from "../constants";
import { EntityManager, MikroORM } from "@mikro-orm/core";
import { RequestIdMiddleware } from "../middlewares/request-id.middleware";
import {
  Entities,
  getSchemasFromResource,
  SchemaBuilderService,
  Schemas,
} from "../schema";
import { JsonApiBaseController } from "../controller/base-controller";
import { ModuleExplorerService } from "./services/module-explorer.service";
import { JsonApiBodyParserMiddleware } from "../middlewares/bodyparser.middleware";
import { ControllerFactory } from "../controller/controller-factory";
import { DataLayerService } from "../data-layer/data-layer.service";
import { Resource, ResourceOptions } from "../decorators/resource.decorator";
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
import type { Request, Response } from "express";
import { JsonApiBaseService } from "../service";

export interface JsonApiModuleOptions
  extends Omit<ModuleMetadata, "controllers"> {
  maxPaginationSize?: number;
  /**
   * Generate request id, used for error id generation.
   * @default Generates a random UUID v4.
   */
  requestId?: (req: Request, res: Response) => Promise<string> | string;
  /**
   * Base URL for the API, used in links generation.
   */
  baseUrl: string;
}

export interface JsonApiResourceModuleOptions
  extends Omit<ModuleMetadata, "controllers">,
    ResourceOptions<any> {
  resource: Type<JsonApiBaseController>;
  service?: Type<JsonApiBaseService>;
}

export interface JsonApiAsyncModuleOptions
  extends Pick<ModuleMetadata, "imports" | "providers">,
    Pick<FactoryProvider<JsonApiModuleOptions>, "useFactory" | "inject"> {}

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

  static forRootAsync(options: JsonApiAsyncModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: JSONAPI_GLOBAL_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const providers: Provider[] = [
      optionsProvider,
      ...(options.providers || []),
    ];

    return this.buildRootModule({
      imports: options.imports ?? [],
      providers,
      exports: [...providers],
    });
  }

  private static buildRootModule(
    config: Omit<ModuleMetadata, "controller">,
  ): DynamicModule {
    const entityManagerProvider: FactoryProvider<EntityManager> = {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em,
      inject: [MikroORM],
    };

    const schemaRepositoryProvider: FactoryProvider<Map<string, Type<any>>> = {
      provide: SCHEMA_REPOSITORY,
      useFactory: (schemaRegistry: SchemaRegistryService) =>
        schemaRegistry.getSchemaMap(),
      inject: [SchemaRegistryService],
    };

    const resourceRegistryProvider: FactoryProvider<
      Set<Type<JsonApiBaseController>>
    > = {
      provide: JSONAPI_RESOURCE_REGISTRY,
      useFactory: () => new Set<Type<JsonApiBaseController>>(),
    };

    const serviceRegistryProvider: FactoryProvider<
      Set<Type<JsonApiBaseService>>
    > = {
      provide: JSONAPI_SERVICE_REGISTRY,
      useFactory: () => new Set<Type<JsonApiBaseService>>(),
    };

    const coreProviders: Provider[] = [
      ModuleExplorerService,
      entityManagerProvider,
      schemaRepositoryProvider,
      resourceRegistryProvider,
      serviceRegistryProvider,
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
  private static validateService(service: Type<JsonApiBaseService>): void {
    if (!Object.prototype.isPrototypeOf.call(JsonApiBaseService, service)) {
      throw new Error(
        `${service.name}: Must extend ${JsonApiBaseService.name} class to be a valid resource.`,
      );
    }
  }

  static forFeature(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource, service, imports, exports, providers, ...opts } = options;
    Resource(opts as any)(resource);
    const controllerFactory = new ControllerFactory(resource);
    const ResourceClass = controllerFactory.createController();

    if (service) {
      JsonApiModule.validateService(service);
    }

    const ServiceClass =
      service ||
      namedClass(`JsonApi${ResourceClass.name}Service`, JsonApiBaseService);

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
      useFactory: (registry: Set<Type<JsonApiBaseController>>) => {
        registry.add(ResourceClass);
      },
      inject: [JSONAPI_RESOURCE_REGISTRY],
    };

    const registerServiceProvider: FactoryProvider<void> = {
      provide: `REGISTER_JSONAPI_SERVICE_${ResourceClass.name}`,
      useFactory: (registry: Set<Type<JsonApiBaseService>>) => {
        registry.add(ServiceClass);
      },
      inject: [JSONAPI_SERVICE_REGISTRY],
    };

    const serviceProvider: ExistingProvider = {
      provide: JSONAPI_SERVICE,
      useExisting: ServiceClass,
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
        registerServiceProvider,
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
        ServiceClass,
        serviceProvider,
        ...(providers || []),
      ],
      exports: exports || [],
      controllers: [ResourceClass],
    };
  }
}

import { Global, Inject, Module } from "@nestjs/common";
import type {
  DynamicModule,
  FactoryProvider,
  MiddlewareConsumer,
  ModuleMetadata,
  NestModule,
  Type,
  ValueProvider,
} from "@nestjs/common";
import { JsonApiResourceModule } from "./json-api-resource.module";
import { JSONAPI_GLOBAL_OPTIONS, SCHEMA_REPOSITORY } from "../constants";
import { EntityManager, MikroORM } from "@mikro-orm/core";
import { RequestIdMiddleware } from "../middlewares/request-id.middleware";
import {
  BaseSchema,
  getRelations,
  getSchemasFromResource,
  getType,
} from "../schema";
import { JsonBaseController } from "../controller/base-controller";
import { ModuleExplorerService } from "./services/module-exporer.service";
import { JsonApiBodyParserMiddleware } from "../middlewares/bodyparser.middleware";

export interface JsonApiModuleOptions
  extends Omit<ModuleMetadata, "controllers"> {
  resources: Type<JsonBaseController>[];
  maxPaginationSize?: number;
  baseUrl: string;
}

@Global()
@Module({})
export class JsonApiModule implements NestModule {
  @Inject(ModuleExplorerService) private moduleExplorer: ModuleExplorerService;

  configure(consumer: MiddlewareConsumer) {
    const controllers = this.moduleExplorer.getControllersFromModule(
      JsonApiModule.name,
    );
    consumer
      .apply(RequestIdMiddleware, JsonApiBodyParserMiddleware)
      .forRoutes(...controllers);
  }

  static forRoot(options: JsonApiModuleOptions): DynamicModule {
    const resourceTypeMap = new Map<string, Type<BaseSchema<any>>>();
    const modules: DynamicModule[] = [];
    for (const resource of options.resources) {
      const schemas = getSchemasFromResource(resource);
      const { schema } = schemas;
      const type = getType(schema);
      if (!resourceTypeMap.has(type)) {
        collectSchemas(schema, resourceTypeMap);
      }
      const resourceModule = JsonApiResourceModule.forRoot({ resource });
      modules.push(resourceModule);
    }
    const schemaRepositoryMapProvider: FactoryProvider<
      Map<string, Type<BaseSchema<any>>>
    > = {
      provide: SCHEMA_REPOSITORY,
      useFactory: () => new Map(resourceTypeMap),
    };

    const globalOptionsProvider: ValueProvider<JsonApiModuleOptions> = {
      provide: JSONAPI_GLOBAL_OPTIONS,
      useValue: options,
    };

    const entityManagerProvider: FactoryProvider<EntityManager> = {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em.fork(),
      inject: [MikroORM],
    };

    const providers = [
      ModuleExplorerService,
      globalOptionsProvider,
      entityManagerProvider,
      schemaRepositoryMapProvider,
      ...(options.providers ?? []),
    ];

    const imports = [...modules, ...(options.imports ?? [])];
    const exports = [...modules, ...providers, ...(options.exports ?? [])];

    return {
      module: JsonApiModule,
      providers,
      imports,
      exports,
    };
  }
}

function collectSchemas(
  schema: Type<BaseSchema<any>>,
  schemaMap: Map<string, Type<BaseSchema<any>>>,
) {
  const type = getType(schema);

  schemaMap.set(type, schema);

  const relations = getRelations(schema);

  for (const relation of relations) {
    const schema = relation.schema();
    const type = getType(schema);
    if (schemaMap.has(type)) continue;
    collectSchemas(schema, schemaMap);
  }

  return schemaMap;
}

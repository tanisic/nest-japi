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
import { BaseResource } from "../resource/base-resource";
import { JsonApiResourceModule } from "./json-api-resource.module";
import { JSONAPI_DECORATOR_OPTIONS } from "../constants";
import { EntityManager, MikroORM } from "@mikro-orm/core";
import { RequestIdMiddleware } from "../middlewares/request-id.middleware";
import { BaseSchema, getSchemasFromResource, getType } from "../schema";

export interface JsonApiModuleOptions
  extends Omit<ModuleMetadata, "controllers"> {
  resources: Type<BaseResource>[];
  maxPaginationSize?: number;
}

@Global()
@Module({})
export class JsonApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }

  static forRoot(options: JsonApiModuleOptions): DynamicModule {
    const resourceTypeMap = new Map<string, Type<BaseSchema<any>>>();
    const modules: DynamicModule[] = [];
    for (const resource of options.resources) {
      const schemas = getSchemasFromResource(resource);
      const schema = schemas.schema;
      const type = getType(schema);
      if (resourceTypeMap.has(type)) {
        throw new Error(
          `JSON:API type "${type}" already exists on schema ${resourceTypeMap.get(type).name}`,
        );
      }
      resourceTypeMap.set(type, schema);
      const resourceModule = JsonApiResourceModule.forRoot({ resource });
      modules.push(resourceModule);
    }

    const globalOptionsProvider: ValueProvider<JsonApiModuleOptions> = {
      provide: JSONAPI_DECORATOR_OPTIONS,
      useValue: options,
    };

    const entityManagerProvider: FactoryProvider<EntityManager> = {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em.fork(),
      inject: [MikroORM],
    };

    const providers = [
      globalOptionsProvider,
      entityManagerProvider,
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

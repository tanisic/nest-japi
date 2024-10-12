import { Global, Module } from "@nestjs/common";
import type {
  DynamicModule,
  FactoryProvider,
  Type,
  ValueProvider,
} from "@nestjs/common";
import { BaseResource } from "../resource/base-resource";
import { JsonApiResourceModule } from "./json-api-resource.module";
import { JSONAPI_DECORATOR_OPTIONS } from "../constants";
import { EntityManager, MikroORM } from "@mikro-orm/core";

export interface JsonApiModuleOptions {
  resources: Type<BaseResource>[];
  maxPaginationSize?: number;
}

@Global()
@Module({})
export class JsonApiModule {
  static forRoot(options: JsonApiModuleOptions): DynamicModule {
    const modules: DynamicModule[] = [];

    for (const resource of options.resources) {
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

    const providers = [globalOptionsProvider, entityManagerProvider];

    return {
      module: JsonApiModule,
      providers,
      imports: [...modules],
      exports: [...modules, ...providers],
    };
  }
}

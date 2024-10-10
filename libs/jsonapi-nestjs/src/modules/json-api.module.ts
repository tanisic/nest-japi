import { Global, Module } from "@nestjs/common";
import type { DynamicModule, Type, ValueProvider } from "@nestjs/common";
import { BaseResource } from "../resource/base-resource";
import { JsonApiResourceModule } from "./json-api-resource.module";
import { JSONAPI_DECORATOR_OPTIONS } from "./constants";

export interface JsonApiModuleOptions {
  resources: Type<BaseResource>[];
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

    return {
      module: JsonApiModule,
      providers: [globalOptionsProvider],
      imports: [...modules],
      exports: [...modules],
    };
  }
}

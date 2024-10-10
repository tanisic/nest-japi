import { Global, Module } from "@nestjs/common";
import type { DynamicModule, Type } from "@nestjs/common";
import { BaseResource } from "../resource/base-resource";
import { JsonApiResourceModule } from "./json-api-resource.module";

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

    return {
      module: JsonApiModule,
      providers: [],
      imports: [...modules],
      exports: [...modules],
    };
  }
}

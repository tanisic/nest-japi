import { Type, DynamicModule } from "@nestjs/common";
import { createController, namedClass } from "../helpers";
import { BaseResource } from "../resource/base-resource";

export interface JsonApiResourceModuleOptions {
  resource: Type<BaseResource>;
}

export class JsonApiResourceModule {
  static forRoot(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource } = options;

    const ControllerClass = createController(resource);

    return {
      module: namedClass(
        `${ControllerClass.name}Module`,
        JsonApiResourceModule,
      ),
      providers: [],
      controllers: [ControllerClass],
    };
  }
}

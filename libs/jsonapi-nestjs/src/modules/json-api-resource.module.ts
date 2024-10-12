import {
  Type,
  DynamicModule,
  FactoryProvider,
  ValueProvider,
  Logger,
} from "@nestjs/common";
import { createController, namedClass } from "../helpers";
import { BaseResource } from "../resource/base-resource";
import {
  CURRENT_ENTITY,
  CURRENT_ENTITY_METADATA,
  JSONAPI_DECORATOR_OPTIONS,
  JSONAPI_RESOURCE_ENTITY_CLASS,
  JSONAPI_RESOURCE_OPTIONS,
} from "../constants";
import { EntityManager, EntityMetadata, EntityName } from "@mikro-orm/core";
import { SortParamService } from "../query/services/sort-param.service";
import { ResourceOptions } from "../decorators/resource.decorator";
import { JsonApiOptions } from "./json-api-options";
import { JsonApiModuleOptions } from "./json-api.module";
import { PaginateParamService } from "../query/services/pagination-param.service";

export interface JsonApiResourceModuleOptions<DbEntity = unknown> {
  resource: Type<BaseResource<DbEntity>>;
}

export class JsonApiResourceModule {
  static forRoot(options: JsonApiResourceModuleOptions): DynamicModule {
    const { resource } = options;

    const ControllerClass = createController(resource);

    const entity: EntityName<any> = Reflect.getMetadata(
      JSONAPI_RESOURCE_ENTITY_CLASS,
      ControllerClass,
    );

    const entityProvider: ValueProvider<EntityName<any>> = {
      provide: CURRENT_ENTITY,
      useValue: entity,
    };

    const entityMetadataProvider: FactoryProvider<EntityMetadata<any>> = {
      provide: CURRENT_ENTITY_METADATA,
      inject: [CURRENT_ENTITY, EntityManager],
      useFactory: (entity: EntityName<any>, em: EntityManager) => {
        return em.getMetadata().get(entity);
      },
    };

    const resourceOptionsProvider: ValueProvider<ResourceOptions> = {
      provide: JSONAPI_RESOURCE_OPTIONS,
      useValue: Reflect.getMetadata(JSONAPI_RESOURCE_OPTIONS, ControllerClass),
    };

    const allOptionsProvider: FactoryProvider<JsonApiOptions> = {
      provide: JsonApiOptions,
      inject: [JSONAPI_DECORATOR_OPTIONS, JSONAPI_RESOURCE_OPTIONS],
      useFactory: (global: JsonApiModuleOptions, resource: ResourceOptions) =>
        new JsonApiOptions({ global, resource }),
    };

    const module = namedClass(
      `JsonApi${ControllerClass.name}Module`,
      JsonApiResourceModule,
    );

    const logger = new Logger(module.name);
    logger.log(`JSON:API Resource ${ControllerClass.name} initialized`);

    return {
      module,
      providers: [
        resourceOptionsProvider,
        allOptionsProvider,
        entityProvider,
        entityMetadataProvider,
        SortParamService,
        PaginateParamService,
      ],
      controllers: [ControllerClass],
    };
  }
}

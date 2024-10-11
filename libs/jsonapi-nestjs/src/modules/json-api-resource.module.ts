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
  JSONAPI_RESOURCE_ENTITY_CLASS,
} from "../constants";
import { EntityManager, EntityMetadata, EntityName } from "@mikro-orm/core";

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

    const module = namedClass(
      `JsonApi${ControllerClass.name}Module`,
      JsonApiResourceModule,
    );

    const logger = new Logger(module.name);
    logger.log(`JSON:API Resource ${ControllerClass.name} initialized`);

    return {
      module,
      providers: [entityProvider, entityMetadataProvider],
      controllers: [ControllerClass],
    };
  }
}

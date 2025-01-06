import { Inject, Injectable } from "@nestjs/common";
import { getEntityFromSchema, type Schemas } from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import { EntityClass, EntityManager } from "@mikro-orm/core";
import { JsonApiOptions } from "../modules/json-api-options";

@Injectable()
export class DataLayerService<Id = string | number> {
  protected entity: EntityClass<any>;

  constructor(
    private options: JsonApiOptions,
    @Inject(CURRENT_SCHEMAS) private schemas: Schemas,
    private em: EntityManager,
  ) {
    this.entity = getEntityFromSchema(this.schemas.schema);
  }

  getCollection(query: QueryParams) {
    return this.em.findAndCount(
      this.entity,
      {},
      {
        populate: query.include?.dbIncludes || ([] as any),
        offset: query.page?.offset ?? 0,
        limit: query.page?.limit ?? this.options.maxAllowedPagination,
        orderBy: query.sort?.dbOrderBy || {},
      },
    );
  }

  getOne(id: Id, include: QueryParams["include"]) {
    return this.em.findOne(
      this.entity,
      { id },
      { populate: include?.dbIncludes ?? ([] as any[]) },
    );
  }
}

import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  getEntityFromSchema,
  getRelationByName,
  type Schemas,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import {
  Collection,
  EntityClass,
  EntityManager,
  serialize,
} from "@mikro-orm/core";
import type { EntityManager as EM } from "@mikro-orm/postgresql";
import { JsonApiOptions } from "../modules/json-api-options";
import { JapiError } from "ts-japi";

@Injectable()
export class DataLayerService<Id = string | number> {
  protected entity: EntityClass<any>;

  constructor(
    private options: JsonApiOptions,
    @Inject(CURRENT_SCHEMAS) private schemas: Schemas,
    @Inject(EntityManager)
    private em: EM,
  ) {
    this.entity = getEntityFromSchema(this.schemas.schema);
  }

  getCollection(query: QueryParams) {
    return this.em.findAndCount(
      this.entity,
      query.filter ? { ...query.filter } : {},
      {
        populate: query.include?.dbIncludes || ([] as any),
        offset: query.page?.offset ?? 0,
        limit: query.page?.limit ?? this.options.maxAllowedPagination,
        orderBy: query.sort?.dbOrderBy || {},
      },
    );
  }

  getOne(
    id: Id,
    include: QueryParams["include"] = { dbIncludes: [], schemaIncludes: [] },
  ) {
    return this.em.findOne(
      this.entity,
      { id },
      { populate: include?.dbIncludes ?? ([] as any[]) },
    );
  }

  async deleteOne(id: Id) {
    const found = await this.em.findOne(this.entity, { id });
    if (!found) {
      throw new NotFoundException(`Object with id ${id} does not exists.`);
    }
    await this.em.nativeDelete(this.entity, { id });
    return serialize(found, { forceObject: true });
  }
}

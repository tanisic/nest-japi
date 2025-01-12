import { Inject, Injectable } from "@nestjs/common";
import {
  getEntityFromSchema,
  getRelationByName,
  type Schemas,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import { Collection, EntityClass, EntityManager } from "@mikro-orm/core";
import { JsonApiOptions } from "../modules/json-api-options";
import { JapiError } from "ts-japi";

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
      query.filter ? { ...query.filter } : {},
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

  async getRelationship(id: Id, relationName: string) {
    const relation = getRelationByName(this.schemas.schema, relationName);
    const parentData = await this.em.findOne(
      this.entity,
      { id },
      { populate: [relation.dataKey] as any },
    );
    if (!parentData) {
      throw new JapiError({
        status: 404,
        detail: `Item with id ${id} does not exists.`,
      });
    }
    const relationData = parentData[relation.dataKey];
    return relationData instanceof Collection
      ? relationData.getItems()
      : relationData;
  }
}

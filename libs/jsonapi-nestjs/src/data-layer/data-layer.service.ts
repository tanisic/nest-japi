import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  getEntityFromSchema,
  getRelations,
  PostBody,
  SchemaBuilderService,
  type Schemas,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import {
  EntityClass,
  EntityManager,
  ref,
  Reference,
  serialize,
  wrap,
} from "@mikro-orm/core";
import type { EntityManager as EM } from "@mikro-orm/postgresql";
import { JsonApiOptions } from "../modules/json-api-options";
import Relationship from "ts-japi/lib/models/relationship.model";
import { EntityName } from "@mikro-orm/nestjs";

@Injectable()
export class DataLayerService<Id = string | number> {
  protected entity: EntityClass<any>;

  constructor(
    private options: JsonApiOptions,
    @Inject(CURRENT_SCHEMAS) private schemas: Schemas,
    @Inject(EntityManager)
    private em: EM,
    private schemaBuilder: SchemaBuilderService,
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

  async postOne<TAttributes extends Record<string, unknown>>(
    body: PostBody<Id, string, TAttributes>,
  ) {
    const result = {
      ...this.schemaBuilder.transformToDb(
        body.data.attributes,
        this.schemas.createSchema,
      ),
    };

    if (body.relationships) {
      const relations = getRelations(this.schemas.createSchema);

      for (const relation of relations) {
        if (body.relationships && relation.name in body.relationships) {
          const relationSchema = relation.schema();
          const entity = getEntityFromSchema(relationSchema);
          const relationData = body.relationships[relation.name].data;
          if (Array.isArray(relationData)) {
            const relationIds = relationData.map(
              (relationLink) => relationLink.id,
            );
            const items = await this.findObjectsByIds(relationIds, entity);
            result[relation.dataKey] = items;
          } else if (relationData) {
            const item = await this.em.findOne(entity, { id: relationData.id });
            if (!item) {
              throw new NotFoundException(
                `Relation ${relation.name} does not have item with id ${relationData.id}.`,
              );
            }
            result[relation.dataKey] = item;
          } else {
            result[relation.dataKey] = null;
          }
        }
      }
    }

    const data = this.em.create(this.entity, result);
    await this.em.persistAndFlush(data);
    return this.em.findOne(this.entity, { id: data.id });
  }

  async findObjectsByIds(ids: Id[], entity: EntityName<any>) {
    const objects = await this.em.find(entity, { id: { $in: ids } });

    const foundIds = objects.map((obj) => obj.id);

    const missingIds = ids.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `The following IDs on relation do not exist: ${missingIds.join(", ")}`,
      );
    }

    return objects;
  }
}

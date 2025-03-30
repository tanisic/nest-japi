import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  getEntityFromSchema,
  getRelationByName,
  getRelations,
  PatchBody,
  PatchRelationshipBody,
  PostBody,
  SchemaBuilderService,
  type Schemas,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import { EntityClass, EntityManager, serialize, wrap } from "@mikro-orm/core";
import { JsonApiOptions } from "../modules/json-api-options";
import { EntityName } from "@mikro-orm/nestjs";

@Injectable()
export class DataLayerService<
  Id = string | number,
  TEntityManager extends EntityManager = EntityManager,
  ViewEntity = EntityClass<unknown>,
  CreateEntity = ViewEntity,
  UpdateEntity = ViewEntity,
> {
  protected viewEntity: ViewEntity;
  protected createEntity: CreateEntity | ViewEntity;
  protected updateEntity: UpdateEntity | ViewEntity;

  constructor(
    private options: JsonApiOptions,
    @Inject(CURRENT_SCHEMAS) private schemas: Schemas,
    @Inject(EntityManager)
    private em: TEntityManager,
    private schemaBuilder: SchemaBuilderService,
  ) {
    this.viewEntity = getEntityFromSchema(this.schemas.schema) as ViewEntity;
    this.createEntity = this.schemas.createSchema
      ? (getEntityFromSchema(this.schemas.createSchema) as CreateEntity)
      : this.viewEntity;
    this.updateEntity = this.schemas.updateSchema
      ? (getEntityFromSchema(this.schemas.updateSchema) as UpdateEntity)
      : this.viewEntity;
  }

  getAllAndCount(
    query: QueryParams,
    entity: ViewEntity = this.viewEntity,
  ): Promise<[(typeof this.viewEntity)[], number]> {
    return this.em.findAndCount(
      entity as EntityClass<ViewEntity>,
      query.filter ? { ...query.filter } : {},
      {
        populate: query.include?.dbIncludes || ([] as any),
        offset: query.page?.offset ?? 0,
        limit: query.page?.limit ?? this.options.maxAllowedPagination,
        orderBy: query.sort?.dbOrderBy || {},
      },
    );
  }

  getAll(
    query: QueryParams,
    entity: ViewEntity = this.viewEntity,
  ): Promise<(typeof entity)[]> {
    return this.em.find(
      entity as EntityClass<ViewEntity>,
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
    entity: ViewEntity = this.viewEntity,
  ) {
    return this.em.findOne(
      entity as EntityClass<ViewEntity>,
      { id },
      { populate: include?.dbIncludes ?? ([] as any[]) },
    );
  }

  async deleteOne(
    id: Id,
    entity: ViewEntity | CreateEntity | UpdateEntity = this.viewEntity,
  ) {
    const found = await this.em.findOne(
      entity as EntityClass<ViewEntity | CreateEntity | UpdateEntity>,
      {
        id,
      },
    );
    if (!found) {
      throw new NotFoundException(`Object with id ${id} does not exists.`);
    }
    await this.em.removeAndFlush(found);
    return serialize(found, { forceObject: true }) as any;
  }

  async patchOne<TAttributes extends Record<string, unknown>>(
    body: PatchBody<Id, string, TAttributes>,
    entity: UpdateEntity | ViewEntity = this.updateEntity,
  ) {
    const schema = this.schemas.updateSchema || this.schemas.schema;
    const result = {
      ...this.schemaBuilder.transformToDb(body.data.attributes, schema),
    };

    const item = await this.em.findOne(
      entity as EntityClass<CreateEntity | ViewEntity>,
      {
        id: body.data.id,
      },
    );

    if (!item) {
      throw new NotFoundException(
        `Item with id ${body.data.id} does not exist.`,
      );
    }

    if (body.data.relationships) {
      const relations = getRelations(schema);

      for (const relation of relations) {
        if (
          body.data.relationships &&
          relation.name in body.data.relationships
        ) {
          const relationSchema = relation.schema();
          const entity = getEntityFromSchema(relationSchema);
          const relationData = body.data.relationships[relation.name].data;
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

    wrap(item).assign(result, {
      mergeObjectProperties: true,
      em: this.em,
      updateNestedEntities: true,
    });
    await this.em.persistAndFlush(item);
    return item;
  }

  async postOne<TAttributes extends Record<string, unknown>>(
    body: PostBody<Id, string, TAttributes>,
    entity: CreateEntity | ViewEntity = this.createEntity,
  ) {
    const schema = this.schemas.createSchema || this.schemas.schema;
    const result = {
      ...this.schemaBuilder.transformToDb(body.data.attributes, schema),
    };

    if (body.data.relationships) {
      const relations = getRelations(schema);

      for (const relation of relations) {
        if (
          body.data.relationships &&
          relation.name in body.data.relationships
        ) {
          const relationSchema = relation.schema();
          const entity = getEntityFromSchema(relationSchema);
          const relationData = body.data.relationships[relation.name].data;
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

    const data = this.em.create(entity as EntityClass<CreateEntity>, result);
    await this.em.persistAndFlush(data);
    return this.em.findOne(entity as EntityClass<CreateEntity>, {
      id: (data as any).id,
    });
  }

  async patchRelationship(
    id: Id,
    body: PatchRelationshipBody<Id, string, boolean>,
    relationshipName: string,
    parentEntity: ViewEntity | UpdateEntity = this.updateEntity,
  ) {
    const schema = this.schemas.updateSchema || this.schemas.schema;

    const parentItem = await this.em.findOne(parentEntity as any, { id });

    const relation = getRelationByName(schema, relationshipName);

    if (!relation) {
      throw new NotFoundException(
        `Relation '${relationshipName}' does not exist on "${schema.name}".`,
      );
    }

    const relationSchema = relation.schema();

    const relationEntity = getEntityFromSchema(relationSchema);

    if (Array.isArray(body.data)) {
      const ids = body.data.map((item) => item.id);
      const items = await this.findObjectsByIds(ids, relationEntity);
      parentItem[relation.dataKey] = items;
    } else if (body.data) {
      const item = await this.em.findOne(relationEntity, { id: body.data.id });
      if (!item) {
        throw new NotFoundException(
          `Relation ${relation.name} does not have item with id ${body.data.id}.`,
        );
      }
      parentItem[relation.dataKey] = item;
    } else {
      parentItem[relation.dataKey] = null;
    }

    await this.em.persistAndFlush(parentItem);
    return parentItem[relation.dataKey];
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

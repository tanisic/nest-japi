import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Type,
} from "@nestjs/common";
import {
  BaseSchema,
  ExtractRelations,
  getEntityFromSchema,
  getRelationByName,
  getRelations,
  InferEntity,
  PatchBody,
  PatchRelationship,
  PostBody,
  SchemaBuilderService,
  type Schemas,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import {
  Collection,
  EntityClass,
  EntityManager,
  Loaded,
  Populate,
  serialize,
  wrap,
} from "@mikro-orm/core";
import { JsonApiOptions } from "../modules/json-api-options";

@Injectable()
export class DataLayerService<
  Id extends string | number,
  TEntityManager extends EntityManager,
  Schema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = Schema,
  UpdateSchema extends BaseSchema<any> = Schema,
  ViewEntity = InferEntity<Schema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> {
  protected viewEntity: ViewEntity;
  protected createEntity: CreateEntity;
  protected updateEntity: UpdateEntity;

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
      : (this.viewEntity as unknown as CreateEntity);
    this.updateEntity = this.schemas.updateSchema
      ? (getEntityFromSchema(this.schemas.updateSchema) as UpdateEntity)
      : (this.viewEntity as unknown as UpdateEntity);
  }

  getAllAndCount(
    query: QueryParams,
    entity: ViewEntity = this.viewEntity,
  ): Promise<[(typeof entity)[], number]> {
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

  getOne(id: Id, include: string[] = [], entity: ViewEntity = this.viewEntity) {
    return this.em.findOne(
      entity as EntityClass<ViewEntity>,
      { id },
      { populate: include as Populate<string, any> },
    );
  }

  async deleteOne(id: Id, entity: ViewEntity = this.viewEntity) {
    const found = await this.em.findOne(entity as EntityClass<ViewEntity>, {
      id,
    });
    if (!found) {
      throw new NotFoundException(`Object with id ${id} does not exists.`);
    }
    await this.em.removeAndFlush(found);
    return serialize(found, { forceObject: true }) as any;
  }

  async patchOne(
    id: Id,
    body: PatchBody<UpdateSchema>,
    entity: UpdateEntity = this.updateEntity,
  ) {
    const schema = (this.schemas.updateSchema ||
      this.schemas.schema) as Type<UpdateSchema>;
    const result = {
      ...this.schemaBuilder.transformToDb(body.data.attributes ?? {}, schema),
    };

    if (String(id) !== String(body.data.id)) {
      throw new BadRequestException(
        "id field not same as ID parameter from URL.",
      );
    }

    const item = await this.em.findOne(entity as EntityClass<UpdateEntity>, {
      id: body.data.id,
    });

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
          const entity = getEntityFromSchema(
            relationSchema,
          ) as EntityClass<any>;
          const relationData =
            body.data.relationships[
              relation.name as keyof ExtractRelations<UpdateSchema>
            ]?.data;
          if (Array.isArray(relationData)) {
            const relationIds = relationData.map(
              (relationLink) => relationLink.id,
            );
            const items = await this.findObjectsByIds(
              relationIds as Id[],
              // @ts-expect-error
              entity,
            );
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<UpdateSchema>] = items;
          } else if (relationData) {
            const item = await this.em.findOne(entity, { id: relationData.id });
            if (!item) {
              throw new NotFoundException(
                `Relation ${relation.name} does not have item with id ${relationData.id}.`,
              );
            }
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<UpdateSchema>] = item;
          } else {
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<UpdateSchema>] = null;
          }
        }
      }
    }

    wrap(item).assign(result, {
      mergeObjectProperties: true,
      em: this.em,
      updateNestedEntities: true,
      ignoreUndefined: true,
    });
    await this.em.persistAndFlush(item);
    return item;
  }

  async postOne(
    body: PostBody<CreateSchema>,
    entity: CreateEntity = this.createEntity,
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
          const relationData =
            body.data.relationships[
              relation.name as keyof ExtractRelations<CreateSchema>
            ]?.data;
          if (Array.isArray(relationData)) {
            const relationIds = relationData.map(
              (relationLink) => relationLink.id,
            );
            const items = await this.findObjectsByIds(
              relationIds as Id[],
              // @ts-expect-error
              entity,
            );
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<CreateSchema>] = items;
          } else if (relationData) {
            const item = await this.em.findOne(entity, { id: relationData.id });
            if (!item) {
              throw new NotFoundException(
                `Relation ${relation.name} does not have item with id ${relationData.id}.`,
              );
            }
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<CreateSchema>] = item;
          } else {
            // @ts-expect-error
            result[relation.dataKey as keyof InferEntity<CreateSchema>] = null;
          }
        }
      }
    }

    const data = this.em.create(entity as EntityClass<CreateEntity>, result);
    await this.em.persistAndFlush(data);
    return this.em.findOne(entity as EntityClass<CreateEntity>, {
      // @ts-expect-error
      id: data.id,
    }) as unknown as Loaded<CreateEntity>;
  }

  async patchRelationship<
    Schema extends BaseSchema<any>,
    RelationName extends keyof ExtractRelations<Schema>,
    RelatedSchema = Schema[RelationName],
  >(
    id: Id,
    body: PatchRelationship<Schema, RelationName>,
    relationshipName: RelationName,
    parentEntity: UpdateEntity = this.updateEntity,
  ) {
    const schema = (this.schemas.updateSchema ||
      this.schemas.schema) as Type<UpdateSchema>;

    // @ts-expect-error
    const relation = getRelationByName(schema, relationshipName);
    if (!relation) {
      throw new NotFoundException(
        `Relation '${String(relationshipName)}' does not exist on "${schema.name}".`,
      );
    }

    const parentItem = await this.em.findOne(
      parentEntity as EntityClass<UpdateEntity>,
      { id },
      {
        populate: [relation.dataKey as any],
      },
    );

    if (!parentItem) {
      throw new NotFoundException(
        `Parent object with id ${id} does not exist.`,
      );
    }

    const relationSchema = relation.schema();
    const relationEntity = getEntityFromSchema(relationSchema);

    if (Array.isArray(body.data)) {
      // @ts-expect-error
      const relationCollection = parentItem[relation.dataKey];
      if (!(relationCollection instanceof Collection))
        throw Error("Relation is expected to be collection!");
      if (body.data.length) {
        const ids = body.data.map((item) => item.id);
        const items = await this.findObjectsByIds(
          ids as Id[],
          // @ts-expect-error
          relationEntity as EntityClass<InferEntity<RelatedSchema>>,
        );
        relationCollection.set(items);
      } else {
        // Unlinking all relations
        relationCollection.removeAll();
      }
    } else if (body.data) {
      // Setting a single relation
      const item = await this.em.findOne(relationEntity, body.data.id);
      if (!item) {
        throw new NotFoundException(
          `Relation ${relation.name} does not have item with id ${body.data.id}.`,
        );
      }
      // @ts-expect-error
      parentItem[relation.dataKey] = item;
    } else {
      // Unlinking a single relation
      // @ts-expect-error
      parentItem[relation.dataKey] = null;
    }

    await this.em.flush();
    const serialized = serialize(parentItem, {
      forceObject: true,
      populate: [relation.dataKey] as any,
    });
    //@ts-expect-error
    return serialized[relation.dataKey] as EntityDto<
      InferEntity<RelatedSchema>
    >;
  }

  async findObjectsByIds<TEntity>(
    ids: Id[],
    entity: EntityClass<TEntity> & { id: unknown },
  ) {
    const objects = await this.em.find(entity, { id: { $in: ids } });

    const foundIds = objects.map((obj) => String(obj.id));

    const missingIds = ids
      .map((id) => String(id))
      .filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `The following IDs on relation do not exist: ${missingIds.join(", ")}`,
      );
    }

    return objects;
  }
}

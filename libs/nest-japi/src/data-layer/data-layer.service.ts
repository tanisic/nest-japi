import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Type,
} from "@nestjs/common";
import {
  JsonApiSchema,
  CreateSchema,
  ExtractRelations,
  getEntityFromSchema,
  getRelationByName,
  getRelations,
  InferEntity,
  PatchBody,
  PatchRelationship,
  PostBody,
  SchemaBuilderService,
  UpdateSchema,
  ViewSchema,
  type Schemas,
  Entity,
  ExtractAttributes,
} from "../schema";
import { CURRENT_SCHEMAS } from "../constants";
import { QueryParams } from "../query";
import {
  Collection,
  EntityDTO,
  EntityManager,
  Populate,
  wrap,
} from "@mikro-orm/core";
import { JsonApiOptions } from "../modules/json-api-options";
import { RelationAttribute } from "../decorators";

@Injectable()
export class DataLayerService<
  Id extends string | number,
  TEntityManager extends EntityManager,
  TSchemas extends Schemas<any, any, any> = Schemas<any, any, any>,
> {
  declare ViewSchema: ViewSchema<TSchemas>;
  declare CreateSchema: CreateSchema<TSchemas>;
  declare UpdateSchema: UpdateSchema<TSchemas>;

  declare ViewEntity: InferEntity<typeof this.ViewSchema>;
  declare CreateEntity: InferEntity<typeof this.CreateSchema>;
  declare UpdateEntity: InferEntity<typeof this.UpdateSchema>;

  constructor(
    private options: JsonApiOptions<TSchemas>,
    @Inject(CURRENT_SCHEMAS)
    private schemas: TSchemas,
    @Inject(EntityManager)
    private em: TEntityManager,
    private schemaBuilder: SchemaBuilderService,
  ) {}

  protected get viewEntity() {
    return getEntityFromSchema(this.schemas.schema) as Type<
      typeof this.ViewEntity
    >;
  }

  protected get createEntity() {
    return getEntityFromSchema(
      this.schemas.createSchema || this.schemas.schema,
    ) as Type<typeof this.CreateEntity>;
  }

  protected get updateEntity() {
    return getEntityFromSchema(
      this.schemas.updateSchema || this.schemas.schema,
    ) as Type<typeof this.UpdateEntity>;
  }

  get viewSchema() {
    return this.schemas.schema as Type<typeof this.ViewSchema>;
  }

  get createSchema() {
    return (this.schemas.createSchema || this.schemas.schema) as Type<
      typeof this.CreateSchema
    >;
  }

  get updateSchema() {
    return (this.schemas.updateSchema || this.schemas.schema) as Type<
      typeof this.UpdateSchema
    >;
  }

  getAllAndCount(
    query: QueryParams,
    entity: typeof this.viewEntity = this.viewEntity,
  ): Promise<[(typeof this.ViewEntity)[], number]> {
    return this.em.findAndCount(
      entity,
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
    entity: typeof this.viewEntity = this.viewEntity,
  ): Promise<(typeof this.ViewEntity)[]> {
    return this.em.find(entity, query.filter ? { ...query.filter } : {}, {
      populate: query.include?.dbIncludes || ([] as any),
      offset: query.page?.offset ?? 0,
      limit: query.page?.limit ?? this.options.maxAllowedPagination,
      orderBy: query.sort?.dbOrderBy || {},
    });
  }

  getOne(
    id: Id,
    include: string[] = [],
    entity: typeof this.viewEntity = this.viewEntity,
  ) {
    return this.em.findOne(
      entity,
      { id },
      {
        populate: include as Populate<typeof entity, any>,
      },
    ) as Promise<typeof this.ViewEntity | null>;
  }

  async getRelationshipData<
    RelationName extends keyof ExtractRelations<typeof this.ViewSchema>,
  >(
    parentId: Id,
    relation: RelationAttribute<typeof this.ViewSchema, RelationName>,
    entity: typeof this.viewEntity = this.viewEntity,
  ) {
    const parentData = await this.em.findOne(
      entity,
      { id: parentId },
      {
        populate: [relation.dataKey] as Populate<string, any>,
      },
    );

    if (!parentData) {
      throw new NotFoundException(`Parent with id ${parentId} does not exist.`);
    }

    return parentData as Promise<typeof this.ViewEntity>;
  }

  async deleteOne(id: Id, entity: typeof this.viewEntity = this.viewEntity) {
    const found = await this.em.findOne(entity, {
      id,
    });
    if (!found) {
      throw new NotFoundException(`Object with id ${id} does not exists.`);
    }
    await this.em.removeAndFlush(found);
    return found as Promise<typeof this.ViewEntity>;
  }

  async patchOne(
    id: Id,
    body: PatchBody<typeof this.UpdateSchema>,
    entity: typeof this.updateEntity = this.updateEntity,
  ) {
    const result = {
      ...this.schemaBuilder.transformToDb(
        body.data.attributes ??
          ({} as ExtractAttributes<typeof this.UpdateSchema>),
        this.updateSchema,
      ),
    };

    if (String(id) !== String(body.data.id)) {
      throw new BadRequestException(
        "id field not same as ID parameter from URL.",
      );
    }

    const item = await this.em.findOne(entity, {
      id: body.data.id,
    });

    if (!item) {
      throw new NotFoundException(
        `Item with id ${body.data.id} does not exist.`,
      );
    }

    if (body.data.relationships) {
      const relations = getRelations(this.updateSchema);

      for (const relation of relations) {
        if (
          body.data.relationships &&
          relation.name in body.data.relationships
        ) {
          const relationSchema = relation.schema();
          const entity = getEntityFromSchema(relationSchema);
          const relationData =
            body.data.relationships[
              relation.name as keyof ExtractRelations<typeof this.UpdateSchema>
            ]?.data;
          if (Array.isArray(relationData)) {
            const relationIds = relationData.map(
              (relationLink) => relationLink.id,
            );
            const items = await this.findObjectsByIds(
              relationIds as Id[],
              entity,
            );
            result[relation.dataKey as keyof typeof result] = items;
          } else if (relationData) {
            const item = await this.em.findOne(entity, { id: relationData.id });
            if (!item) {
              throw new NotFoundException(
                `Relation ${String(relation.name)} does not have item with id ${relationData.id}.`,
              );
            }
            result[relation.dataKey as keyof typeof result] = item;
          } else {
            result[relation.dataKey as keyof typeof result] = null;
          }
        }
      }
    }

    wrap(item).assign(result as EntityDTO<typeof result>, {
      mergeObjectProperties: true,
      em: this.em,
      updateNestedEntities: true,
      ignoreUndefined: true,
    });
    await this.em.persistAndFlush(item);
    return item as unknown as Promise<typeof this.UpdateEntity>;
  }

  async postOne(
    body: PostBody<typeof this.CreateSchema>,
    entity: typeof this.createEntity = this.createEntity,
  ) {
    const result = {
      ...this.schemaBuilder.transformToDb(
        body.data.attributes,
        this.createSchema,
      ),
    };

    if (body.data.relationships) {
      const relations = getRelations(this.createSchema);

      for (const relation of relations) {
        if (
          body.data.relationships &&
          relation.name in body.data.relationships
        ) {
          const relationSchema = relation.schema();
          const relationEntity = getEntityFromSchema(relationSchema);
          const relationData =
            body.data.relationships[
              relation.name as keyof ExtractRelations<typeof this.CreateSchema>
            ]?.data;
          if (Array.isArray(relationData)) {
            const relationIds = relationData.map(
              (relationLink) => relationLink.id,
            );
            const items = await this.findObjectsByIds(
              relationIds as Id[],
              relationEntity,
            );
            result[relation.dataKey as keyof typeof result] = items;
          } else if (relationData) {
            const item = await this.em.findOne(relationEntity, {
              id: relationData.id,
            });
            if (!item) {
              throw new NotFoundException(
                `Relation ${String(relation.name)} does not have item with id ${relationData.id}.`,
              );
            }
            result[relation.dataKey! as keyof typeof result] = item;
          } else {
            result[relation.dataKey as keyof typeof result] = null;
          }
        }
      }
    }

    const data = this.em.create(entity, result);
    await this.em.persistAndFlush(data);
    return this.em.findOne(entity, {
      id: data.id,
    }) as Promise<typeof this.CreateEntity>;
  }

  async patchRelationship<
    TSchema extends JsonApiSchema<any>,
    RelationName extends keyof ExtractRelations<TSchema>,
  >(
    id: Id,
    body: PatchRelationship<TSchema, RelationName>,
    relationshipName: RelationName,
    parentEntity: typeof this.updateEntity = this.updateEntity,
  ) {
    const relation = getRelationByName(this.updateSchema, relationshipName);

    if (!relation) {
      throw new NotFoundException(
        `Relation '${String(relationshipName)}' does not exist on "${this.updateSchema.name}".`,
      );
    }

    const parentItem = await this.em.findOne(
      parentEntity,
      { id },
      {
        populate: [relation.dataKey] as Populate<typeof parentEntity, any>,
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
      const relationCollection = parentItem[relation.dataKey];
      if (!(relationCollection instanceof Collection))
        throw Error("Relation is expected to be collection!");
      if (body.data.length) {
        const ids = body.data.map((item) => item.id);
        const items = await this.findObjectsByIds(ids as Id[], relationEntity);
        relationCollection.set(items);
      } else {
        // Unlinking all relations
        relationCollection.removeAll();
      }
    } else if (body.data) {
      // Setting a single relation
      const item = await this.em.findOne(relationEntity, {
        id: body.data.id,
      });

      if (!item) {
        throw new NotFoundException(
          `Relation ${String(relation.name)} does not have item with id ${body.data.id}.`,
        );
      }
      parentItem[relation.dataKey] = item;
    } else {
      // Unlinking a single relation
      parentItem[relation.dataKey] = null;
    }

    await this.em.flush();
    return parentItem as unknown as Promise<typeof this.UpdateEntity>;
  }

  async findObjectsByIds<TEntity extends Entity<Id>>(
    ids: Id[],
    entity: Type<TEntity>,
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

    return objects as unknown as Promise<TEntity[]>;
  }
}

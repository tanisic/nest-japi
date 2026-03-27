import { EntityDTO, EntityManager } from "@mikro-orm/core";
import {
  CreateSchema,
  ExtractRelations,
  InferEntity,
  PatchBody,
  PatchRelationship,
  PostBody,
  RelationKeys,
  UpdateSchema,
  ViewSchema,
  type Schemas,
} from "../schema";
import { Inject, Injectable, Type } from "@nestjs/common";
import { QueryParams, SingleQueryParams } from "../query";
import { DataLayerService } from "../data-layer/data-layer.service";
import { JsonApiOptions } from "../modules";
import { CURRENT_SCHEMAS } from "../constants";
import { RelationAttribute } from "../decorators";

@Injectable()
export class JsonApiBaseService<
  Id extends string | number = string | number,
  TEntityManager extends EntityManager = EntityManager,
  TSchemas extends Schemas<any, any, any> = Schemas<any, any, any>,
> {
  declare ViewSchema: ViewSchema<TSchemas>;
  declare CreateSchema: CreateSchema<TSchemas>;
  declare UpdateSchema: UpdateSchema<TSchemas>;

  declare ViewEntity: InferEntity<typeof this.ViewSchema>;
  declare CreateEntity: InferEntity<typeof this.CreateSchema>;
  declare UpdateEntity: InferEntity<typeof this.UpdateSchema>;

  @Inject(JsonApiOptions)
  protected options!: JsonApiOptions<TSchemas>;

  @Inject(DataLayerService)
  protected dataLayer!: DataLayerService<Id, TEntityManager, TSchemas>;
  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas!: TSchemas;

  get viewSchema() {
    return this.currentSchemas.schema as Type<typeof this.ViewSchema>;
  }

  get createSchema() {
    return (this.currentSchemas.createSchema ||
      this.currentSchemas.schema) as Type<typeof this.CreateSchema>;
  }

  get updateSchema() {
    return (this.currentSchemas.updateSchema ||
      this.currentSchemas.schema) as Type<typeof this.UpdateSchema>;
  }

  async getAll(queryParams: QueryParams): Promise<{
    data: InferEntity<ViewSchema<TSchemas>>[];
    count: number;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const [data, count] = await this.dataLayer.getAllAndCount(queryParams);

    return { data, count, documentMeta: { count } };
  }
  async getOne(
    id: Id,
    queryParams: SingleQueryParams,
  ): Promise<{
    data: InferEntity<ViewSchema<TSchemas>> | null | undefined;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = (await this.dataLayer.getOne(
      id,
      queryParams.include?.dbIncludes,
    )) as InferEntity<ViewSchema<TSchemas>> | null;

    return { data };
  }
  async getRelationship<
    RelationName extends RelationKeys<typeof this.ViewSchema> = RelationKeys<
      typeof this.ViewSchema
    >,
  >(
    id: Id,
    relation: RelationAttribute<typeof this.ViewSchema, RelationName>,
  ): Promise<{
    data:
      | InferEntity<ViewSchema<TSchemas>>[]
      | InferEntity<ViewSchema<TSchemas>>
      | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const relationData = await this.dataLayer.getRelationshipData(id, relation);

    return { data: relationData };
  }
  async getRelationshipData<
    RelationName extends RelationKeys<typeof this.ViewSchema> = RelationKeys<
      typeof this.ViewSchema
    >,
  >(
    id: Id,
    relation: RelationAttribute<typeof this.ViewSchema, RelationName>,
  ): Promise<{
    data: InferEntity<ViewSchema<TSchemas>> | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const relationData = await this.dataLayer.getRelationshipData(id, relation);

    return { data: relationData };
  }

  async deleteOne(id: Id): Promise<{
    data: InferEntity<ViewSchema<TSchemas>>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.deleteOne(id);

    return { data };
  }

  async postOne(body: PostBody<CreateSchema<TSchemas>>): Promise<{
    data: InferEntity<CreateSchema<TSchemas>>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.postOne(body);
    return { data };
  }

  async patchOne(
    id: Id,
    body: PatchBody<UpdateSchema<TSchemas>>,
  ): Promise<{
    data: InferEntity<UpdateSchema<TSchemas>>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.patchOne(id, body);
    return { data };
  }

  async patchRelationship<
    RelationName extends keyof ExtractRelations<UpdateSchema<TSchemas>>,
  >(
    id: Id,
    relation: RelationAttribute<UpdateSchema<TSchemas>, RelationName>,
    body: PatchRelationship<UpdateSchema<TSchemas>, RelationName>,
  ): Promise<{
    data: InferEntity<UpdateSchema<TSchemas>>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.patchRelationship(
      id,
      body,
      relation.name,
    );

    return { data };
  }
}

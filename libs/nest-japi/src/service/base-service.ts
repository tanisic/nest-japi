import { EntityDTO, EntityManager } from "@mikro-orm/core";
import {
  BaseSchema,
  ExtractRelations,
  InferEntity,
  PatchBody,
  PatchRelationship,
  PostBody,
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
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
  ViewEntity = InferEntity<ViewSchema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> {
  @Inject(JsonApiOptions)
  protected options!: JsonApiOptions<ViewSchema, CreateSchema, UpdateSchema>;

  @Inject(DataLayerService)
  protected dataLayer!: DataLayerService<
    Id,
    TEntityManager,
    ViewSchema,
    CreateSchema,
    UpdateSchema
  >;
  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas!: Schemas<ViewSchema, CreateSchema, UpdateSchema>;

  get viewSchema() {
    return this.currentSchemas.schema;
  }

  get createSchema() {
    return (this.currentSchemas.createSchema ||
      this.currentSchemas.schema) as Type<CreateSchema>;
  }

  get updateSchema() {
    return (this.currentSchemas.updateSchema ||
      this.currentSchemas.schema) as Type<UpdateSchema>;
  }

  async getAll(queryParams: QueryParams): Promise<{
    data: ViewEntity[];
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
    data: ViewEntity | null | undefined;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = (await this.dataLayer.getOne(
      id,
      queryParams.include?.dbIncludes,
    )) as ViewEntity | null;

    return { data };
  }
  async getRelationship(
    id: Id,
    relation: RelationAttribute<ViewSchema, boolean, any>,
  ): Promise<{
    data: EntityDTO<any>[] | EntityDTO<any> | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const relationData = await this.dataLayer.getRelationshipData(id, relation);

    return { data: relationData as EntityDTO<any>[] | EntityDTO<any> | null };
  }
  async getRelationshipData(
    id: Id,
    relation: RelationAttribute<ViewSchema, boolean, any>,
  ): Promise<{
    data: EntityDTO<any>[] | EntityDTO<any> | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const relationData = await this.dataLayer.getRelationshipData(id, relation);

    return { data: relationData };
  }

  async deleteOne(id: Id): Promise<{
    data: EntityDTO<any> | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const relationData = await this.dataLayer.deleteOne(id);

    return { data: relationData as EntityDTO<any> | null };
  }

  async postOne(body: PostBody<CreateSchema>): Promise<{
    data: EntityDTO<any>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.postOne(body);
    return { data };
  }

  async patchOne(
    id: Id,
    body: PatchBody<UpdateSchema>,
  ): Promise<{
    data: EntityDTO<any>;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = await this.dataLayer.patchOne(id, body);
    return { data };
  }

  async patchRelationship<
    RelationName extends keyof ExtractRelations<UpdateSchema>,
  >(
    id: Id,
    relation: RelationAttribute<UpdateSchema, boolean, any>,
    body: PatchRelationship<UpdateSchema, RelationName>,
  ): Promise<{
    data: EntityDTO<any>;
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

import { EntityManager } from "@mikro-orm/core";
import {
  BaseSchema,
  ExtractRelations,
  InferEntity,
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
    relation: RelationAttribute<
      ViewSchema,
      boolean,
      keyof ExtractRelations<ViewSchema>
    >,
  ): Promise<{
    data: ViewEntity[] | ViewEntity | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = (await this.dataLayer.getOne(id, [
      relation.dataKey as keyof ExtractRelations<ViewSchema>,
    ])) as ViewEntity | ViewEntity[] | null;

    return { data };
  }
  async getRelationshipData(
    id: Id,
    relation: RelationAttribute<
      ViewSchema,
      boolean,
      keyof ExtractRelations<ViewSchema>
    >,
  ): Promise<{
    data: ViewEntity[] | ViewEntity | null;
    documentMeta?: Record<string, any>;
    resourceMeta?: Record<string, any>;
  }> {
    const data = (await this.dataLayer.getOne(id, [
      relation.dataKey as keyof ExtractRelations<ViewSchema>,
    ])) as ViewEntity | ViewEntity[] | null;

    return { data };
  }
  // deleteOne: (...arg: any[]) => any;
  // postOne: (...arg: any[]) => any;
  // patchOne: (...arg: any[]) => any;
  // patchRelationship: (...arg: any[]) => any;
}

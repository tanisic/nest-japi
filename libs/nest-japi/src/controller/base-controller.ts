import { Inject, NotFoundException, Type } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityDTO, EntityManager, serialize, wrap } from "@mikro-orm/core";
import type { ExtractRelations, InferEntity, Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { SchemaBuilderService } from "../schema/services/schema-builder.service";
import { JsonApiOptions } from "../modules/json-api-options";
import { DataDocument, Metaizer, Paginator } from "ts-japi";
import { DataLayerService } from "../data-layer/data-layer.service";
import {
  type BaseSchema,
  getRelationByName,
  PatchBody,
  PatchRelationship,
  PostBody,
} from "../schema";
import { Request } from "express";
import type { QueryParams, SingleQueryParams } from "../query";
import { joinUrlPaths } from "../helpers";
import qs, { ParsedQs } from "qs";
import { RelationAttribute } from "../decorators/relation.decorator";

type ControllerMethods = { [k in MethodName]: (...arg: any[]) => any };

type ControllerGenerics<
  Id extends string | number = string | number,
  TEntityManager extends EntityManager = EntityManager,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
  ViewEntity = InferEntity<ViewSchema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> = {
  Id: Id;
  TEntityManager: TEntityManager;
  ViewSchema: ViewSchema;
  CreateSchema: CreateSchema;
  UpdateSchema: UpdateSchema;
  ViewEntity: ViewEntity;
  CreateEntity: CreateEntity;
  UpdateEntity: UpdateEntity;
};

export type InferControllerGenerics<T> = T extends {
  __generics: ControllerGenerics;
}
  ? T["__generics"]
  : never;

export class JsonBaseController<
  Id extends string | number = string | number,
  TEntityManager extends EntityManager = EntityManager,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
  ViewEntity = InferEntity<ViewSchema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> implements ControllerMethods
{
  public __generics!: ControllerGenerics<
    Id,
    TEntityManager,
    ViewSchema,
    CreateSchema,
    UpdateSchema,
    ViewEntity,
    CreateEntity,
    UpdateEntity
  >;

  @Inject(SerializerService)
  protected serializerService!: SerializerService;

  @Inject(EntityManager)
  protected em!: TEntityManager;

  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas!: Schemas<ViewSchema, CreateSchema, UpdateSchema>;

  @Inject(SchemaBuilderService)
  protected schemaBuilder!: SchemaBuilderService;

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

  get baseUrl() {
    return this.options.global.baseUrl;
  }

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

  async getAll(
    query: QueryParams,
    request: Request,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const [data, count] = await this.dataLayer.getAllAndCount(query);
    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(
      unwrapped as EntityDTO<ViewEntity>,
      this.viewSchema,
    );

    const pagination = this.generatePagination(request, count);
    return this.serializerService.serialize(result, this.viewSchema, {
      page: query.page || undefined,
      include: query.include?.schemaIncludes || [],
      fields: query.fields?.schema || {},
      linkers: {
        paginator: pagination,
      },
      metaizers: {
        document: new Metaizer(() => ({ count })),
      },
    });
  }

  async getOne(
    id: Id,
    query: SingleQueryParams,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const data = await this.dataLayer.getOne(id, query.include?.dbIncludes);

    if (!data) {
      throw new NotFoundException(`Object with id ${id} does not exist.`);
    }

    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(
      unwrapped,
      this.viewSchema,
    );

    return this.serializerService.serialize(result, this.viewSchema, {
      include: query.include?.schemaIncludes || [],
      fields: query.fields?.schema || {},
    });
  }

  async getRelationship<
    RelationName extends keyof ExtractRelations<ViewSchema>,
  >(id: Id, relationName: RelationName, ...rest: any[]) {
    const schema = this.currentSchemas.schema;
    const relation = getRelationByName(
      this.currentSchemas.schema as Type<ViewSchema>,
      relationName,
    );
    if (!relation) {
      throw new NotFoundException(
        `Relationship ${String(relationName)} does not exist on schema "${schema.name}".`,
      );
    }

    const data = await this.dataLayer.getOne(id, [
      relation.dataKey as keyof ExtractRelations<ViewSchema>,
    ]);

    if (!data) {
      throw new NotFoundException("Root data does not exist.");
    }

    const unwrapped = serialize(data, {
      forceObject: true,
      populate: [relation.dataKey as any],
    }) as EntityDTO<ViewEntity>;
    const relationSchema = relation.schema();

    const result = this.schemaBuilder.transformFromDb(
      unwrapped[
        relation.dataKey as keyof EntityDTO<ViewEntity>
      ] as EntityDTO<any>,
      relationSchema,
    );

    const shouldDisplayNull = (
      relation: RelationAttribute<
        ViewSchema,
        boolean,
        keyof ExtractRelations<ViewSchema>
      >,
      rootData: EntityDTO<object>,
    ) => {
      const relationData =
        rootData[relation.dataKey as keyof EntityDTO<object>];
      if (relation.many || Array.isArray(relationData)) return false;
      if (!relationData || !Object.keys(relationData).length) {
        return true;
      }

      return false;
    };
    return this.serializerService.serialize(result, relationSchema, {
      onlyIdentifier: true,
      nullData: shouldDisplayNull(relation, unwrapped),
    });
  }

  async getRelationshipData<
    RelationName extends keyof ExtractRelations<ViewSchema>,
  >(id: Id, relationName: RelationName) {
    const schema = this.currentSchemas.schema;
    const relation = getRelationByName(schema, relationName);
    if (!relation) {
      throw new NotFoundException(
        `Relationship ${String(relationName)} does not exist on schema "${schema.name}".`,
      );
    }

    const relSchema = relation.schema();

    const data = await this.dataLayer.getOne(id, [
      relation.dataKey as keyof ExtractRelations<ViewSchema>,
    ]);
    if (!data) {
      throw new NotFoundException("Root data does not exist.");
    }

    const unwrapped = wrap(data).serialize({
      forceObject: true,
      populate: [relation.dataKey as any],
    });

    const result = this.schemaBuilder.transformFromDb(
      unwrapped[relation.dataKey as keyof EntityDTO<object>],
      relSchema,
    );

    return this.serializerService.serialize(result, relSchema);
  }

  async deleteOne(id: Id, ..._rest: any[]) {
    const data = await this.dataLayer.deleteOne(id);
    return this.serializerService.serialize(data, this.currentSchemas.schema);
  }

  async postOne(body: PostBody<CreateSchema>) {
    const data = await this.dataLayer.postOne(body);
    const serialized = serialize(data, { forceObject: true });
    const result = this.schemaBuilder.transformFromDb(
      serialized,
      this.currentSchemas.schema,
    );
    return this.serializerService.serialize(result, this.currentSchemas.schema);
  }

  async patchOne(id: Id, body: PatchBody<UpdateSchema>) {
    const data = await this.dataLayer.patchOne(id, body);
    const serialized = serialize(data, { forceObject: true });
    const result = this.schemaBuilder.transformFromDb(
      serialized,
      this.currentSchemas.schema,
    );
    return this.serializerService.serialize(result, this.currentSchemas.schema);
  }

  async patchRelationship<
    RelationName extends keyof ExtractRelations<UpdateSchema>,
  >(
    id: Id,
    relationshipName: RelationName,
    body: PatchRelationship<UpdateSchema, RelationName>,
  ) {
    const schema = (this.currentSchemas.updateSchema ||
      this.currentSchemas.schema) as Type<UpdateSchema>;
    const data = await this.dataLayer.patchRelationship(
      id,
      body,
      relationshipName,
    );

    const relation = getRelationByName(schema, relationshipName);

    if (!relation) {
      throw new NotFoundException(
        `Relationship ${String(relationshipName)} does not exist on ${schema.name} schema.`,
      );
    }

    const relationSchema = relation.schema();

    const result = this.schemaBuilder.transformFromDb(data, relationSchema);
    return this.serializerService.serialize(result, relationSchema);
  }

  private generatePagination(
    request: Request,
    totalCount: number,
  ): Paginator<unknown> {
    return new Paginator((data) => {
      const params = request.query;
      if (!params?.page) return;

      const totalPages = Math.ceil(
        totalCount / Number((params.page as ParsedQs).size),
      );
      const currentPage = Number((params.page as ParsedQs).number);
      const baseUrl = joinUrlPaths(this.baseUrl, request.path);

      const generateUrl = (pageNumber: number, params: ParsedQs) => {
        const p = {
          ...params,
          page: {
            ...(params.page as ParsedQs),
            number: pageNumber,
          },
        };
        const queryString = qs.stringify(p, {
          encode: false,
          skipNulls: true,
        });
        return `${baseUrl}?${queryString}`;
      };

      const first = generateUrl(1, params);
      const last = generateUrl(totalPages, params);
      const next =
        currentPage < totalPages ? generateUrl(currentPage + 1, params) : null;
      const prev =
        currentPage > 1 ? generateUrl(currentPage - 1, params) : null;

      return Array.isArray(data)
        ? {
            first,
            last,
            next,
            prev,
          }
        : undefined;
    });
  }
}

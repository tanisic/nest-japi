import { Inject, NotFoundException, Type } from "@nestjs/common";
import { ControllerGenerics, ControllerMethods } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityDTO, EntityManager, serialize } from "@mikro-orm/core";
import type { ExtractRelations, InferEntity, Schemas } from "../schema/types";
import { CURRENT_SCHEMAS, JSONAPI_SERVICE } from "../constants";
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
import { type JsonApiBaseService } from "../service";

export class JsonApiBaseController<
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
  declare public __generics: ControllerGenerics<
    Id,
    TEntityManager,
    ViewSchema,
    CreateSchema,
    UpdateSchema,
    ViewEntity,
    CreateEntity,
    UpdateEntity
  >;
  @Inject(JSONAPI_SERVICE)
  protected service!: JsonApiBaseService;

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
    const { data, count, documentMeta, resourceMeta } =
      await this.service.getAll(query);
    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(
      unwrapped as any,
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
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
    });
  }

  async getOne(
    id: Id,
    query: SingleQueryParams,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const { data, documentMeta, resourceMeta } = await this.service.getOne(
      id,
      query,
    );

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
      metaizers: {
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
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

    const {
      data: relationData,
      documentMeta,
      resourceMeta,
    } = await this.service.getRelationship(id, relation);

    const relationSchema = relation.schema();

    if (!relationData) {
      return this.serializerService.serialize(relationData, relationSchema, {
        onlyIdentifier: true,
        nullData: this.shouldDisplayNull(relation, relationData),
        metaizers: {
          document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
          resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
        },
      });
    }

    const unwrapped = serialize(relationData, {
      forceObject: true,
    });

    const result = this.schemaBuilder.transformFromDb(
      unwrapped as EntityDTO<any>,
      relationSchema,
    );

    return this.serializerService.serialize(result, relationSchema, {
      onlyIdentifier: true,
      nullData: this.shouldDisplayNull(relation, relationData),
      metaizers: {
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
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

    const {
      data: relationData,
      resourceMeta,
      documentMeta,
    } = await this.service.getRelationshipData(id, relation);

    if (!relationData) {
      return this.serializerService.serialize(relationData, relSchema, {
        onlyIdentifier: true,
        nullData: this.shouldDisplayNull(relation, relationData),
        metaizers: {
          document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
          resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
        },
      });
    }

    const unwrapped = serialize(relationData, {
      forceObject: true,
    });

    const result = this.schemaBuilder.transformFromDb(
      unwrapped as EntityDTO<any>,
      relSchema,
    );

    return this.serializerService.serialize(result, relSchema, {
      nullData: this.shouldDisplayNull(relation, relationData),
      metaizers: {
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
    });
  }

  async deleteOne(id: Id, ..._rest: any[]) {
    const { data, documentMeta, resourceMeta } =
      await this.service.deleteOne(id);
    return this.serializerService.serialize(data, this.currentSchemas.schema, {
      metaizers: {
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
    });
  }

  async postOne(body: PostBody<CreateSchema>) {
    const { data, documentMeta, resourceMeta } = await this.service.postOne(
      body as any,
    );
    const serialized = serialize(data, { forceObject: true });
    const result = this.schemaBuilder.transformFromDb(
      serialized,
      this.currentSchemas.schema,
    );
    return this.serializerService.serialize(
      result,
      this.currentSchemas.schema,
      {
        metaizers: {
          document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
          resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
        },
      },
    );
  }

  async patchOne(id: Id, body: PatchBody<UpdateSchema>) {
    const { data, documentMeta, resourceMeta } = await this.service.patchOne(
      id,
      body as any,
    );
    const serialized = serialize(data, { forceObject: true });
    const result = this.schemaBuilder.transformFromDb(
      serialized,
      this.currentSchemas.schema,
    );
    return this.serializerService.serialize(
      result,
      this.currentSchemas.schema,
      {
        metaizers: {
          document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
          resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
        },
      },
    );
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

    const relation = getRelationByName(schema, relationshipName);

    if (!relation) {
      throw new NotFoundException(
        `Relationship ${String(relationshipName)} does not exist on ${schema.name} schema.`,
      );
    }

    const relationSchema = relation.schema();

    const { data, resourceMeta, documentMeta } =
      // @ts-expect-error strange TS error
      await this.service.patchRelationship(id, relation, body);

    const result = this.schemaBuilder.transformFromDb(data, relationSchema);
    return this.serializerService.serialize(result, relationSchema, {
      metaizers: {
        document: documentMeta ? new Metaizer(() => documentMeta) : undefined,
        resource: resourceMeta ? new Metaizer(() => resourceMeta) : undefined,
      },
    });
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
  private shouldDisplayNull = (
    relation: RelationAttribute<ViewSchema, boolean, any>,
    relationData: EntityDTO<object> | EntityDTO<object>[] | null,
  ) => {
    if (relation.many || Array.isArray(relationData)) return false;
    if (!relationData || !Object.keys(relationData).length) {
      return true;
    }

    return false;
  };
}

import { Inject, NotFoundException } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityDTO, EntityManager, serialize } from "@mikro-orm/core";
import type { Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { SchemaBuilderService } from "../schema/services/schema-builder.service";
import { JsonApiOptions } from "../modules/json-api-options";
import { DataDocument, Metaizer, Paginator } from "ts-japi";
import { DataLayerService } from "../data-layer/data-layer.service";
import { BaseSchema, getRelationByName } from "../schema";
import { Request } from "express";
import type { QueryParams, SingleQueryParams } from "../query";
import { joinUrlPaths } from "../helpers";
import qs, { ParsedQs } from "qs";

type ControllerMethods = { [k in MethodName]: (...arg: any[]) => any };

type InferEntity<T> = T extends BaseSchema<infer U> ? U : never;

export class JsonBaseController<
  Id = string | number,
  TEntityManager extends EntityManager = EntityManager,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
  ViewEntity = InferEntity<ViewSchema>,
  CreateEntity = InferEntity<CreateSchema>,
  UpdateEntity = InferEntity<UpdateSchema>,
> implements ControllerMethods
{
  @Inject(SerializerService)
  protected serializerService: SerializerService;

  @Inject(EntityManager)
  protected em: TEntityManager;

  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas: Schemas;

  @Inject(SchemaBuilderService)
  protected schemaBuilder: SchemaBuilderService;

  @Inject(JsonApiOptions)
  protected options: JsonApiOptions;

  @Inject(DataLayerService)
  protected dataLayer: DataLayerService<
    Id,
    TEntityManager,
    ViewEntity,
    CreateEntity,
    UpdateEntity
  >;

  get baseUrl() {
    return this.options.global.baseUrl;
  }

  async getAll(
    query: QueryParams,
    request: Request,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const schema = this.currentSchemas.schema;
    const [data, count] = await this.dataLayer.getAllAndCount(query);
    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(
      unwrapped as EntityDTO<ViewEntity>,
      schema,
    );

    const pagination = this.generatePagination(request, count);
    return this.serializerService.serialize(result, schema, {
      page: query.page,
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
    const schema = this.currentSchemas.schema;
    const data = await this.dataLayer.getOne(id, query.include);

    if (!data) {
      throw new NotFoundException(`Object with id ${id} does not exist.`);
    }

    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(unwrapped, schema);

    return this.serializerService.serialize(result, schema, {
      include: query.include?.schemaIncludes || [],
      fields: query.fields?.schema || {},
    });
  }

  async getRelationship(id: Id, relationName: string, ...rest: any[]) {
    const schema = this.currentSchemas.schema;
    const relation = getRelationByName(
      this.currentSchemas.schema,
      relationName,
    );
    if (!relation) {
      throw new NotFoundException(
        `Relationship ${relationName} does not exist on schema "${schema.name}".`,
      );
    }

    const data = await this.dataLayer.getOne(id, {
      dbIncludes: [relation.dataKey],
      schemaIncludes: [],
    });

    if (!data) {
      throw new NotFoundException("Root data does not exist.");
    }

    const unwrapped = serialize(data, {
      forceObject: true,
      populate: [relation.dataKey as any],
      skipNull: true,
    });

    const result = this.schemaBuilder.transformFromDb(unwrapped, schema);

    return this.serializerService.serialize(
      result,
      this.currentSchemas.schema,
      {
        onlyIdentifier: true,
        onlyRelationship: relationName,
      },
    );
  }

  async deleteOne(id: Id, ...rest: any[]) {
    const data = await this.dataLayer.deleteOne(id);
    return this.serializerService.serialize(data, this.currentSchemas.schema);
  }

  async postOne(body: unknown, ...args: any[]) {
    const data = await this.dataLayer.postOne(body as any);
    const serialized = serialize(data, { forceObject: true });
    const result = this.schemaBuilder.transformFromDb(
      serialized,
      this.currentSchemas.schema,
    );
    return this.serializerService.serialize(result, this.currentSchemas.schema);
  }

  // Update a specific resource (patch)
  patchOne(...args: any[]) {
    const [id, updateData] = args;
    // Simulated resource update
    return {
      id,
      message: `Resource with ID ${id} updated.`,
      updateData,
    };
  }

  // Update a relationship for a specific resource
  patchRelationship(...args: any[]) {
    const [id, relationshipName, updateData] = args;
    // Simulated relationship update
    return {
      id,
      relationshipName,
      message: `Relationship ${relationshipName} for resource with ID ${id} updated.`,
      updateData,
    };
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

import { Inject, NotFoundException } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityManager, serialize } from "@mikro-orm/core";
import type { Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { SchemaBuilderService } from "../schema/services/schema-builder.service";
import { JsonApiOptions } from "../modules/json-api-options";
import { DataDocument, JapiError, Metaizer, Paginator } from "ts-japi";
import { DataLayerService } from "../data-layer/data-layer.service";
import { getRelationByName } from "../schema";
import { Request } from "express";
import type { QueryParams, SingleQueryParams } from "../query";
import { joinUrlPaths } from "../helpers";
import qs, { ParsedQs } from "qs";

type RequestMethodes = { [k in MethodName]: (...arg: any[]) => any };

export class JsonBaseController<Id = string | number>
  implements RequestMethodes
{
  @Inject(SerializerService)
  protected serializerService: SerializerService;

  @Inject(EntityManager)
  protected em: EntityManager;

  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas: Schemas;

  @Inject(SchemaBuilderService)
  protected schemaBuilder: SchemaBuilderService;

  @Inject(JsonApiOptions)
  protected options: JsonApiOptions;

  @Inject(DataLayerService)
  protected dataLayer: DataLayerService<Id>;

  get baseUrl() {
    return this.options.global.baseUrl;
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

      // Helper to generate URL with updated query parameters
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

      // Build pagination links
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

  async getAll(
    query: QueryParams,
    request: Request,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const schema = this.currentSchemas.schema;
    const [data, count] = await this.dataLayer.getCollection(query);
    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(unwrapped, schema);

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
      throw new JapiError({
        status: 400,
        detail: `Relationship ${relationName} does not exist on schema "${schema.name}".`,
      });
    }

    const data = await this.dataLayer.getOne(id, {
      dbIncludes: [relation.dataKey],
      schemaIncludes: [],
    });

    const unwrapped = serialize(data, {
      forceObject: true,
      populate: [relation.dataKey as any],
    });

    const result = this.schemaBuilder.transformFromDb(unwrapped, schema);

    // return this.serializerService.serializeRelation(
    //   result,
    //   this.currentSchemas.schema,
    //   relationName,
    // );
  }

  // Delete a single resource by ID
  deleteOne(id: Id, ...rest: any[]) {
    // Simulated deletion of a resource
    return { id, message: `Resource with ID ${id} deleted.` };
  }

  // Delete a specific relationship for a resource
  deleteRelationship(id: Id, relationName: string, ...rest: any[]) {
    return {
      id,
      message: `Relationship  for resource with ID ${id} deleted.`,
    };
  }

  // Create a new resource
  postOne(...args: any[]) {
    const [resourceData] = args;
    // Simulated resource creation
    return { message: "Resource created.", resourceData };
  }

  // Create a new relationship for a resource
  postRelationship(...args: any[]) {
    const [id, relationshipData] = args;
    // Simulated relationship creation
    return {
      id,
      message: `Relationship created for resource with ID ${id}.`,
      relationshipData,
    };
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
}

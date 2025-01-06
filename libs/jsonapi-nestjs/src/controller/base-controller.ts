import { Inject, NotFoundException } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityManager, serialize } from "@mikro-orm/core";
import { QueryParams, SingleQueryParams } from "../query";
import type { Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { SchemaBuilderService } from "../schema/services/schema-builder.service";
import { JsonApiOptions } from "../modules/json-api-options";
import { DataDocument, Metaizer } from "ts-japi";
import { DataLayerService } from "../data-layer/data-layer.service";

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

  async getAll(
    query: QueryParams,
    ..._rest: any[]
  ): Promise<Partial<DataDocument<any>>> {
    const schema = this.currentSchemas.schema;
    const [data, count] = await this.dataLayer.getCollection(query);
    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(unwrapped, schema);

    return this.serializerService.serialize(result, schema, {
      page: query.page,
      include: query.include?.schemaIncludes || [],
      fields: query.fields?.schema || {},
      meta: new Metaizer(() => {
        return { count };
      }),
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
  // Get a related resource or relationship for a specific resource
  getRelationship(id: Id, relationName: string, ...rest: any[]) {
    // Simulated relationship fetch based on the resource ID and relationship name
    return { id };
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

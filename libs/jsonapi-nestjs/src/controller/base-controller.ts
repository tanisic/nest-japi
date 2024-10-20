import { Inject } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityManager, serialize } from "@mikro-orm/core";
import { QueryParams } from "../query";
import type { Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { getEntityFromSchema } from "../schema";
import { inspect } from "util";
import { SchemaBuilderService } from "../schema/services/schema-builder.service";

type RequestMethodes = { [k in MethodName]: (...arg: any[]) => any };

export class JsonBaseController implements RequestMethodes {
  @Inject(SerializerService)
  protected serializerService: SerializerService;

  @Inject(EntityManager)
  protected em: EntityManager;

  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas: Schemas;

  @Inject(SchemaBuilderService)
  protected schemaBuilder: SchemaBuilderService;

  async getAll(query: QueryParams, ..._rest: any[]): Promise<any> {
    console.log(query);
    const entity = getEntityFromSchema(this.currentSchemas.schema);
    const [data, count] = await this.em.findAndCount(
      entity,
      {},
      {
        populate: query.include?.dbIncludes || ([] as any),
        // offset: query.page.number * query.page.size || 0,
        // limit: query.page.size,
        // populateOrderBy: query.sort.dbOrderBy,
        orderBy: query.sort?.dbOrderBy || {},
      },
    );

    const unwrapped = serialize(data, {
      populate: query.include?.dbIncludes || ([] as any),
      forceObject: true,
    });
    const result = this.schemaBuilder.transformFromDb(
      unwrapped,
      this.currentSchemas.schema,
    );
    console.log(result);

    return this.serializerService.serialize(
      result,
      this.currentSchemas.schema,
      {
        page: query.page,
        include: query.include?.dbIncludes || [],
        fields: query.fields,
      },
    );
  }
  getOne(id: string | number, query: QueryParams, ...rest: any[]) {
    return { id, query };
  }
  // Get a related resource or relationship for a specific resource
  getRelationship(id: string | number, relationName: string, ...rest: any[]) {
    // Simulated relationship fetch based on the resource ID and relationship name
    return { id };
  }

  // Delete a single resource by ID
  deleteOne(id: string | number, ...rest: any[]) {
    // Simulated deletion of a resource
    return { id, message: `Resource with ID ${id} deleted.` };
  }

  // Delete a specific relationship for a resource
  deleteRelationship(
    id: string | number,
    relationName: string,
    ...rest: any[]
  ) {
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

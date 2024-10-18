import { Inject } from "@nestjs/common";
import { MethodName } from "./types";
import { SerializerService } from "../serializer/serializer.service";
import { EntityManager, serialize } from "@mikro-orm/core";
import { QueryParams } from "../query";
import type { Schemas } from "../schema/types";
import { CURRENT_SCHEMAS } from "../constants";
import { getEntityFromSchema } from "../schema";

type RequestMethodes = { [k in MethodName]: (...arg: any[]) => any };

export class JsonBaseController implements RequestMethodes {
  @Inject(SerializerService)
  protected serializerService: SerializerService;

  @Inject(EntityManager)
  protected em: EntityManager;

  @Inject(CURRENT_SCHEMAS)
  protected currentSchemas: Schemas;

  async getAll(query: QueryParams, ..._rest: any[]): Promise<any> {
    const entity = getEntityFromSchema(this.currentSchemas.schema);
    const [data, count] = await this.em.findAndCount(
      entity,
      {},
      {
        populate: query.include as any,
        offset: query.page.number * query.page.size,
        limit: query.page.size,
        orderBy: query.sort,
      },
    );
    const unwrapped = serialize(data, {
      populate: query.include as any,
      forceObject: true,
    });

    return this.serializerService.serialize(
      unwrapped,
      this.currentSchemas.schema,
      {
        ...(query as any),
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

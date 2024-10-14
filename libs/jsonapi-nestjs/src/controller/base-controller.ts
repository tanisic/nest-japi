import { Dependencies, Inject, Injectable, Param, Query } from "@nestjs/common";
import { BaseResource } from "../resource/base-resource";
import { MethodName } from "./types";

type RequestMethodeObject = { [k in MethodName]: (...arg: any[]) => any };

export class JsonBaseController<R extends BaseResource>
  implements RequestMethodeObject
{
  getAll(query: any) {
    return query;
  }
  getOne(id: string | number, query: any) {
    return { id, query };
  }
  // Get a related resource or relationship for a specific resource
  getRelationship(...args: any[]) {
    const [id, relationshipName] = args;
    // Simulated relationship fetch based on the resource ID and relationship name
    return { id, relationshipName, relationshipData: "Related data" };
  }

  // Delete a single resource by ID
  deleteOne(...args: any[]) {
    const [id] = args;
    // Simulated deletion of a resource
    return { id, message: `Resource with ID ${id} deleted.` };
  }

  // Delete a specific relationship for a resource
  deleteRelationship(...args: any[]) {
    const [id, relationshipName] = args;
    // Simulated deletion of a relationship
    return {
      id,
      relationshipName,
      message: `Relationship ${relationshipName} for resource with ID ${id} deleted.`,
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

import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import { Linker, Relator, Serializer, SerializerOptions } from "ts-japi";
import {
  getAttributes,
  getRelations,
  getResourceOptions,
  getSchemasFromResource,
  getType,
} from "../schema/helpers/schema-helper";
import { Pagination } from "../query";
import { joinUrlPaths } from "../helpers";
import { JsonApiOptions } from "../modules/json-api-options";
import { BaseResource } from "../resource/base-resource";

export interface SerializeCustomOptions {
  include?: string[];
  fields?: Record<string, string[]>;
  page?: Pagination;
}

type JsonApiTypeString = string;
type RelatorKey = `${JsonApiTypeString}__${JsonApiTypeString}`;

@Injectable()
export class SerializerService {
  private resources: Type<BaseResource<any>>[];
  private serializerMap = new Map<JsonApiTypeString, Serializer<unknown>>();
  private relatorsMap = new Map<RelatorKey, Relator<unknown, unknown>>();

  constructor(private globalOptions: JsonApiOptions) {
    this.baseUrl = this.globalOptions.global.baseUrl;
    this.resources = this.globalOptions.global.resources ?? [];
    this.generateSerializers();
    this.generateRelators();
    this.connectSerializersAndRelators();
  }

  private baseUrl: string;

  private getResourceBySchema(schema: Type<BaseSchema<any>>) {
    return this.resources.find(
      (resource) => getResourceOptions(resource).schemas.schema === schema,
    );
  }

  protected resourceUrl(resource: Type<BaseResource<any>>) {
    const options = getResourceOptions(resource);
    return joinUrlPaths(this.baseUrl, options.path!);
  }

  private generateSerializers() {
    for (const resource of this.resources) {
      const schemas = getSchemasFromResource(resource);
      const { schema } = schemas;
      const type = getType(schema);
      let projection = {};
      for (const attribute of getAttributes(schema)) {
        projection = { ...projection, [attribute.name]: 1 };
      }
      const resourceLinker = new Linker((parent) => {
        return joinUrlPaths(this.resourceUrl(resource), String(parent.id));
      });
      const serializer = new Serializer(type, {
        projection,
        linkers: { resource: resourceLinker },
      });
      this.serializerMap.set(type, serializer);
    }
  }

  private generateRelators() {
    for (const resource of this.resources) {
      const schemas = getSchemasFromResource(resource);
      const { schema } = schemas;
      const type = getType(schema);
      for (const relation of getRelations(schema)) {
        const relationSchema = relation.schema();
        const relationType = getType(relationSchema);
        const relationSerializer = this.serializerMap.get(relationType);
        const relationLinker = new Linker((parentData, relationData) => {
          return Array.isArray(relationData)
            ? joinUrlPaths(
                this.resourceUrl(resource),
                `relationships/${relation.name}`,
              )
            : joinUrlPaths(
                this.resourceUrl(resource),
                `/${parentData.id}/relationships/${relation.name}`,
              );
        });
        const relatedLinker = new Linker((parentData, relationData) => {
          return Array.isArray(relationData)
            ? joinUrlPaths(this.resourceUrl(resource), `/${relation.name}`)
            : joinUrlPaths(
                this.resourceUrl(resource),
                `/${parentData.id}/${relation.name}`,
              );
        });
        const relator = new Relator(
          (data) => data[relation.name],
          relationSerializer,
          {
            linkers: { relationship: relationLinker, related: relatedLinker },
            relatedName: relation.name,
          },
        );
        this.relatorsMap.set(`${type}__${relationType}`, relator);
      }
    }
  }

  private connectSerializersAndRelators() {
    for (const [type, serializer] of Array.from(this.serializerMap.entries())) {
      const relators = this.getTypeRelators(type);
      serializer.setRelators(relators);
      this.serializerMap.set(type, serializer);
    }
  }

  serialize(
    data: any,
    schema: Type<BaseSchema<any>>,
    options?: SerializeCustomOptions & Partial<SerializerOptions<unknown>>,
  ) {
    const type = getType(schema);
    const serializer = this.serializerMap.get(type);
    const resource = this.getResourceBySchema(schema);
    const resourcePath = this.resourceUrl(resource);
    return serializer.serialize(data, {
      ...options,
      projection: this.getVisibleAttributesOrSparse(schema, options?.fields),
      include: options?.include ?? 0,
      linkers: {
        ...options?.linkers,
      },
    });
  }

  private getTypeRelators(
    type: JsonApiTypeString,
  ): Relator<unknown, unknown>[] {
    const validRelatorKeys = Array.from(this.relatorsMap.keys()).filter((key) =>
      key.startsWith(type),
    );
    const result = [];
    for (const key of validRelatorKeys) {
      result.push(this.relatorsMap.get(key));
    }
    return result;
  }

  private getVisibleAttributesOrSparse(
    schema: Type<BaseSchema<any>>,
    sparseFields?: Record<string, string[]>,
  ): Record<string, 1> {
    const result = {};

    if (sparseFields) {
      const type = getType(schema);
      if (type in sparseFields) {
        for (const field of sparseFields[type]) {
          result[field] = 1;
        }
        return result;
      }
    }

    const attributes = getAttributes(schema);
    for (const attrib of attributes) {
      result[attrib.name] = 1;
    }
    return result;
  }
}

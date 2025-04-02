import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import {
  DataDocument,
  Linker,
  Relator,
  Serializer,
  SerializerOptions,
} from "ts-japi";
import {
  getAttributes,
  getRelations,
  getResourceOptions,
  getSchemasFromResource,
  getType,
} from "../schema/helpers/schema-helper";
import { Pagination, SparseFields } from "../query";
import { joinUrlPaths } from "../helpers";
import { JsonApiOptions } from "../modules/json-api-options";
import Resource from "ts-japi/lib/models/resource.model";
import { JsonBaseController } from "../controller/base-controller";
import ResourceIdentifier from "ts-japi/lib/models/resource-identifier.model";

export interface SerializeCustomOptions {
  include?: string[];
  fields?: Record<string, string[]>;
  page?: Pagination;
}

type JsonApiTypeString = string;
type CollectionName = string;
type RelatorKey = `${JsonApiTypeString}__${CollectionName}`;
type SerializePostProcessProps = {
  fields?: SparseFields["schema"];
};

@Injectable()
export class SerializerService {
  private resources: Type<JsonBaseController>[];
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

  protected resourceUrl(resource: Type<JsonBaseController>) {
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
        const relationName = relation.name;
        const relationType = getType(relationSchema);
        const relationSerializer = this.serializerMap.get(relationType);
        const relationLinker = new Linker((parentData) => {
          return joinUrlPaths(
            this.resourceUrl(resource),
            `/${parentData.id}/relationships/${relation.name}`,
          );
        });
        const relatedLinker = new Linker((parentData) => {
          return joinUrlPaths(
            this.resourceUrl(resource),
            `/${parentData.id}/${relationName}`,
          );
        });
        const relator = new Relator(
          (data) => data[relationName],
          relationSerializer,
          {
            linkers: { relationship: relationLinker, related: relatedLinker },
            relatedName: relationName,
          },
        );
        this.relatorsMap.set(`${type}__${relationName}`, relator);
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

  async serialize(
    data: any,
    schema: Type<BaseSchema<any>>,
    options?: SerializeCustomOptions & Partial<SerializerOptions<unknown>>,
  ) {
    const type = getType(schema);
    const serializer = this.serializerMap.get(type);
    const projection = this.getVisibleAttributesOrSparse(
      schema,
      options?.fields,
    );
    const document = await serializer.serialize(data, {
      ...options,
      projection,
      include: options?.include ?? [],
      linkers: {
        ...options?.linkers,
      },
    });
    return this.postProcess(document, { fields: options?.fields });
  }

  private postProcess(
    document: Partial<DataDocument<unknown>>,
    { fields }: SerializePostProcessProps,
  ) {
    if (Array.isArray(document.data)) {
      document.data = document.data.map((item) =>
        this.postProcessItem(item, { fields }),
      );
    } else if (document.data) {
      document.data = this.postProcessItem(document.data, { fields });
    }
    document.included = document.included.map((item) =>
      this.postProcessSingleResource(item, { fields }),
    );
    return document;
  }

  private postProcessItem(
    item: ResourceIdentifier | Resource<unknown>,
    { fields }: SerializePostProcessProps,
  ) {
    if (this.isResource(item)) {
      return this.postProcessSingleResource(item, { fields });
    } else {
      return this.postProcessSingleResourceIdentifier(item);
    }
  }

  private isResource(item: any): item is Resource<unknown> {
    return (
      (!!item.attributes || !!item.relationships) && !!item.id && !!item.type
    );
  }

  private postProcessSingleResource(
    resource: Resource<unknown>,
    { fields }: SerializePostProcessProps,
  ) {
    const allowedFields = fields[resource.type] || [];
    if (resource.id && typeof resource.id !== "string") {
      resource.id = String(resource.id);
    }

    if (resource.attributes && allowedFields.length) {
      resource.attributes = Object.fromEntries(
        Object.entries(resource.attributes).filter(([key]) =>
          allowedFields.includes(key),
        ),
      );
    }

    if (resource.relationships) {
      for (const [relKey, relation] of Object.entries(resource.relationships)) {
        if (Array.isArray(relation.data)) {
          resource.relationships[relKey].data = relation.data.map((data) =>
            this.postProcessSingleResourceIdentifier(data),
          );
        } else if (relation.data) {
          resource.relationships[relKey].data =
            this.postProcessSingleResourceIdentifier(relation.data);
        }
      }
    }
    return resource;
  }

  private postProcessSingleResourceIdentifier(
    identifier: ResourceIdentifier,
  ): ResourceIdentifier {
    return { ...identifier, id: String(identifier.id) } as ResourceIdentifier;
  }

  private transformSparseFields(
    document: Partial<DataDocument<unknown>>,
    sparseFields?: SparseFields["schema"],
  ): Partial<DataDocument<unknown>> {
    if (!sparseFields) return document;

    const filterFields = (
      resource: Resource<unknown>,
      allowedFields: string[],
    ) => {
      if (resource.id) {
        resource.id = String(resource.id);
      }
      if (resource.attributes) {
        resource.attributes = Object.fromEntries(
          Object.entries(resource.attributes).filter(([key]) =>
            allowedFields.includes(key),
          ),
        );
      }
      return resource;
    };

    // Process `data`
    if (Array.isArray(document.data)) {
      document.data = document.data.map((resource) =>
        sparseFields[resource.type]
          ? filterFields(resource, sparseFields[resource.type])
          : resource,
      );
    } else if (document.data && sparseFields[document.data.type]) {
      document.data = filterFields(
        document.data,
        sparseFields[document.data.type],
      );
    }

    // Process `included`
    if (document.included) {
      document.included = document.included.map((resource) =>
        sparseFields[resource.type]
          ? filterFields(resource, sparseFields[resource.type])
          : resource,
      );
    }

    return document;
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

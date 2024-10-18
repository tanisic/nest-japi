import { Inject, Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import { RelationAttribute } from "../decorators/relation.decorator";
import { Paginator, Relator, Serializer, SerializerOptions } from "ts-japi";
import {
  getAttributes,
  getRelations,
  getType,
} from "../schema/helpers/schema-helper";
import { Pagination } from "../query";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";
import { concatenatePaths } from "../helpers";
import { stringify } from "qs";

export interface SerializeCustomOptions {
  include?: string[];
  fields?: Record<string, string[]>;
  page?: Pagination;
}

@Injectable()
export class SerializerService {
  private options?: SerializeCustomOptions | undefined;
  private serializerMap = new Map<string, Serializer>();

  constructor(
    @Inject(REQUEST)
    private request: Request,
  ) {
    this.baseUrl = `${request.protocol}://${request.get("Host")}`;
  }

  private baseUrl: string;

  serialize(
    data: any,
    schema: Type<BaseSchema<any>>,
    options?: SerializeCustomOptions,
  ) {
    this.options = options;
    const resolved = this.resolve(schema);
    return resolved.serialize(data);
  }

  private createPaginator() {
    const paginate = this.options.page;
    if (paginate) {
      const req = this.request;

      const params: Record<string, any> = { ...req.query };
      delete params.page;

      const prevParams = {
        ...params,
        page: { ...paginate, number: paginate.number - 1 },
      };

      const nextParams = {
        ...params,
        page: { ...paginate, number: paginate.number + 1 },
      };
      const prevUrl = concatenatePaths(
        this.baseUrl,
        req.path,
        `?${stringify(prevParams)}`,
      );
      const nextUrl = concatenatePaths(
        this.baseUrl,
        req.path,
        `?${stringify(nextParams)}`,
      );
      const hasPrev = paginate.number > 1;
      return new Paginator(() => {
        return {
          prev: hasPrev ? prevUrl : null,
          next: nextUrl,
          first: null,
          last: null,
        };
      });
    }
  }

  private calculateMaxIncludeDepth(includes?: string[]) {
    let maxLen = 0;
    if (!includes) return maxLen;

    for (const include of includes) {
      const splitParts = include.split(".");
      if (splitParts.length > maxLen) {
        maxLen = splitParts.length;
      }
    }
    return maxLen;
  }

  private resolve(schema: Type<BaseSchema<any>>) {
    const type = getType(schema);
    const visibleAttributes = this.getVisibleAttributesOrSparse(schema);
    const relations = getRelations(schema);
    const rootSerializer = this.findOrCreateSerializer(type, {
      projection: visibleAttributes,
      include: this.calculateMaxIncludeDepth(this.options.include),
      linkers: {
        paginator: this.createPaginator(),
      },
    });

    for (const relation of relations) {
      this.resolveRelation(relation, this.serializerMap.get(type));
    }

    return rootSerializer;
  }

  private resolveRelation(
    relation: RelationAttribute,
    parentSerializer: Serializer,
  ) {
    const relSchema = relation.schema();
    const relType = getType(relSchema);

    const serializer = this.findOrCreateSerializer(relType, {
      projection: this.getVisibleAttributesOrSparse(relSchema),
    });
    const relator = new Relator((data) => data[relation.dataKey], serializer);
    parentSerializer.setRelators({
      ...parentSerializer.getRelators(),
      [relType]: relator,
    });
    this.serializerMap.set(relType, serializer);

    const relations = getRelations(relSchema);
    for (const rel of relations) {
      const schema = rel.schema();
      const type = getType(schema);
      if (this.serializerMap.has(type)) continue;
      this.resolveRelation(rel, serializer);
    }
  }

  private findOrCreateSerializer(
    type: string,
    newOptions?: Partial<SerializerOptions>,
  ) {
    if (this.serializerMap.has(type)) {
      return this.serializerMap.get(type);
    }

    const newSerializer = new Serializer(type, newOptions);
    this.serializerMap.set(type, newSerializer);
    return this.serializerMap.get(type);
  }

  private getVisibleAttributesOrSparse(
    schema: Type<BaseSchema<any>>,
  ): Record<string, 1> {
    const result = {};

    const sparseFields = this.options?.fields;

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

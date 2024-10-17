import { Injectable, Scope, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import { RelationAttribute } from "../decorators/relation.decorator";
import { Relator, Serializer, SerializerOptions } from "ts-japi";
import {
  getAttributes,
  getRelations,
  getType,
} from "../schema/helpers/schema-helper";

export interface SerializeCustomOptions {
  include?: string[];
  sparseFields?: Record<string, string[]>;
}

@Injectable({ scope: Scope.REQUEST })
export class SerializerService {
  private options?: SerializeCustomOptions | undefined;
  private serializerMap = new Map<string, Serializer>();

  serialize(
    data: any,
    schema: Type<BaseSchema<any>>,
    options?: SerializeCustomOptions,
  ) {
    this.options = options;
    const resolved = this.resolve(schema);
    return resolved.serialize(data);
  }

  private resolve(schema: Type<BaseSchema<any>>) {
    const type = getType(schema);
    const visibleAttributes = this.getVisibleAttributesOrSparse(schema);
    const relations = getRelations(schema);
    const rootSerializer = this.findOrCreateSerializer(type, {
      projection: visibleAttributes,
      include: this.options?.include || [],
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

    const sparseFields = this.options?.sparseFields;

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

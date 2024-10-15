import { Injectable, Scope, Type } from "@nestjs/common";
import { BaseSchema } from "../schema/base-schema";
import { RelationAttribute } from "../decorators/relation.decorator";
import {
  JSONAPI_SCHEMA_ATTRIBUTES,
  JSONAPI_SCHEMA_RELATIONS,
  JSONAPI_SCHEMA_TYPE,
} from "../constants";
import { SchemaAttribute } from "../decorators/attribute.decorator";
import { Relator, Serializer, SerializerOptions } from "ts-japi";

@Injectable()
export class SerializerService {
  constructor() {}

  serialize(data: any, schema: Type<BaseSchema<any>>) {
    const resolved = this.resolve(schema);
    console.log(resolved);
    return resolved.serialize(data);
  }

  private resolve(
    schema: Type<BaseSchema<any>>,
    serializerMap = new Map<string, Serializer>(),
  ) {
    const type = this.getType(schema);
    const visibleAttributes = this.getVisibleAttributes(schema);
    const relations = this.getRelations(schema);
    const rootSerializer = this.findOrCreateSerializer(type, serializerMap, {
      projection: visibleAttributes,
      include: 10,
    });

    for (const relation of relations) {
      this.resolveRelation(relation, serializerMap, serializerMap.get(type));
    }

    return rootSerializer;
  }

  private resolveRelation(
    relation: RelationAttribute,
    serializerMap: Map<string, Serializer>,
    parentSerializer: Serializer,
  ) {
    const relSchema = relation.schema();
    const relType = this.getType(relSchema);

    const serializer = this.findOrCreateSerializer(relType, serializerMap, {
      projection: this.getVisibleAttributes(relSchema),
      include: 10,
    });
    const relator = new Relator((data) => data[relation.dataKey], serializer);
    parentSerializer.setRelators({
      ...parentSerializer.getRelators(),
      [relType]: relator,
    });
    serializerMap.set(relType, serializer);

    const relations = this.getRelations(relSchema);
    for (const rel of relations) {
      const schema = rel.schema();
      const type = this.getType(schema);
      if (serializerMap.has(type)) continue;
      this.resolveRelation(rel, serializerMap, serializer);
    }
  }

  private findOrCreateSerializer(
    type: string,
    serializerMap: Map<string, Serializer>,
    newOptions?: Partial<SerializerOptions>,
  ) {
    if (serializerMap.has(type)) {
      return serializerMap.get(type);
    }

    const newSerializer = new Serializer(type, newOptions);
    serializerMap.set(type, newSerializer);
    return serializerMap.get(type);
  }

  private getRelations(schema: Type<BaseSchema<any>>): RelationAttribute[] {
    const relations =
      Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, schema.prototype) || [];
    return relations;
  }

  private getAttributes(schema: Type<BaseSchema<any>>): SchemaAttribute[] {
    const attributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, schema.prototype) || [];
    return attributes;
  }
  private getType(schema: Type<BaseSchema<any>>): string {
    const type = Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, schema);

    if (!type) {
      throw new Error(`JSON:API type is not defiend on ${schema.name}.`);
    }

    return type;
  }

  private getVisibleAttributes(
    schema: Type<BaseSchema<any>>,
  ): Record<string, 1> {
    const result = {};
    const attributes = this.getAttributes(schema);
    for (const attrib of attributes) {
      result[attrib.name] = 1;
    }
    return result;
  }
}

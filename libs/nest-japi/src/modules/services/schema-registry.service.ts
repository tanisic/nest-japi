import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  Type,
} from "@nestjs/common";
import {
  JsonApiSchema,
  getRelations,
  getSchemasFromResource,
  getType,
} from "../../schema";
import { JSONAPI_RESOURCE_REGISTRY } from "../../constants";
import { type JsonApiController } from "../../controller/base-controller";

@Injectable()
export class SchemaRegistryService implements OnApplicationBootstrap {
  private schemaMap = new Map<string, Type<JsonApiSchema<any>>>();

  constructor(
    @Inject(JSONAPI_RESOURCE_REGISTRY)
    private readonly registry: Set<Type<JsonApiController>>,
  ) {}

  onApplicationBootstrap() {
    for (const resource of this.registry) {
      const { schema } = getSchemasFromResource(resource);
      this.schemaMap = this.collectSchemas(schema, this.schemaMap);
    }
  }

  collectSchemas(
    schema: Type<JsonApiSchema<any>>,
    schemaMap: Map<string, Type<JsonApiSchema<any>>>,
  ) {
    const type = getType(schema);

    schemaMap.set(type, schema);

    const relations = getRelations(schema);

    for (const relation of relations) {
      const schema = relation.schema();
      const type = getType(schema);
      if (schemaMap.has(type)) continue;
      this.collectSchemas(schema, schemaMap);
    }

    return schemaMap;
  }

  getSchemaMap(): Map<string, Type<JsonApiSchema<any>>> {
    return this.schemaMap;
  }
}

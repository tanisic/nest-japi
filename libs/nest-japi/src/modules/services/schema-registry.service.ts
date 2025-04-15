import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  Type,
} from "@nestjs/common";
import {
  BaseSchema,
  getRelations,
  getSchemasFromResource,
  getType,
} from "../../schema";
import { JSONAPI_RESOURCE_REGISTRY } from "../../constants";
import { type JsonBaseController } from "../../controller/base-controller";

@Injectable()
export class SchemaRegistryService implements OnApplicationBootstrap {
  private schemaMap = new Map<string, Type<BaseSchema<any>>>();

  constructor(
    @Inject(JSONAPI_RESOURCE_REGISTRY)
    private readonly registry: Set<Type<JsonBaseController>>,
  ) {}

  onApplicationBootstrap() {
    for (const resource of this.registry) {
      const { schema } = getSchemasFromResource(resource);
      this.schemaMap = this.collectSchemas(schema, this.schemaMap);
    }
  }

  collectSchemas(
    schema: Type<BaseSchema<any>>,
    schemaMap: Map<string, Type<BaseSchema<any>>>,
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

  getSchemaMap(): Map<string, Type<BaseSchema<any>>> {
    return this.schemaMap;
  }
}

import { Inject, Injectable, Type } from "@nestjs/common";
import { JSONAPI_RESOURCE_REGISTRY } from "../../constants";
import { type JsonApiBaseController } from "../../controller/base-controller";

@Injectable()
export class JsonApiResourceExplorerService {
  constructor(
    @Inject(JSONAPI_RESOURCE_REGISTRY)
    private readonly registry: Set<Type<JsonApiBaseController>>,
  ) {}

  /**
   * Get all registered JSON:API resource classes (controllers).
   */
  getAllResources(): Type<JsonApiBaseController>[] {
    return Array.from(this.registry);
  }
}

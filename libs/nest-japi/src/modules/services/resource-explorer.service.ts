import { Inject, Injectable, Type } from "@nestjs/common";
import { JSONAPI_RESOURCE_REGISTRY } from "../../constants";
import { type JsonBaseController } from "../../controller/base-controller";

@Injectable()
export class JsonApiResourceExplorerService {
  constructor(
    @Inject(JSONAPI_RESOURCE_REGISTRY)
    private readonly registry: Set<Type<JsonBaseController>>,
  ) {}

  /**
   * Get all registered JSON:API resource classes (controllers).
   */
  getAllResources(): Type<JsonBaseController>[] {
    return Array.from(this.registry);
  }
}

import type { Type } from "@nestjs/common";
import type { JSONAPI_RESOURCE_TYPE } from "../module/constants";

interface Schema {}
interface Entity {}

export abstract class BaseResource {
  abstract [JSONAPI_RESOURCE_TYPE]: string;
  abstract schema: Type<Schema>;
  abstract entity: Type<Entity>;
}

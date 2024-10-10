import { Get } from "@nestjs/common";
import { JSONAPI_RESOURCE_TYPE } from "../modules/constants";

export interface Schema {}
export interface Entity {}

export abstract class BaseResource {
  abstract [JSONAPI_RESOURCE_TYPE]: string;
  abstract schema: Schema;
  abstract entity: Entity;

  @Get()
  getOne() {
    return this[JSONAPI_RESOURCE_TYPE];
  }
}

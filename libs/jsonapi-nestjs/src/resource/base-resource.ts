import { Get } from "@nestjs/common";
import { JSONAPI_RESOURCE_TYPE } from "../constants";

export interface Schema {}
export interface Entity {}

export abstract class BaseResource {
  abstract schema: Schema;
  abstract entity: Entity;

  get type() {
    return Reflect.getMetadata(JSONAPI_RESOURCE_TYPE, this.constructor);
  }

  @Get()
  getOne() {
    // return this[JSONAPI_RESOURCE_TYPE];
    return this.type;
  }
}

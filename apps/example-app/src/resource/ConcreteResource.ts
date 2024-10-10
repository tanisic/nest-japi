import { Get } from '@nestjs/common';
import {
  BaseResource,
  Entity,
  JSONAPI_RESOURCE_TYPE,
  Resource,
  Schema,
} from 'jsonapi-nestjs';

@Resource({ jsonapiType: 'concrete', path: 'concrete_resource' })
export class ConcreteResource extends BaseResource {
  schema: Schema = {};
  entity: Entity = {};
  [JSONAPI_RESOURCE_TYPE] = 'concrete';

  @Get()
  public override getOne(): string {
    console.log(this['TEST']);
    return 'a';
  }
}

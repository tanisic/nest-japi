import { BaseResource, Entity, Resource, Schema } from 'jsonapi-nestjs';

@Resource({ path: 'concrete_resource' })
export class ConcreteResource extends BaseResource {
  schema: Schema = {};
  entity: Entity = {};

  // @Get()
  // getOne() {
  //   return '';
  // }
}

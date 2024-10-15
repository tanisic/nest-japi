import { Attribute, BaseSchema, Schema } from 'jsonapi-nestjs';

type Workplace = {
  id: string;
  address: string;
  floor: number;
  employees: number;
};
@Schema({
  jsonapiType: 'workplaces',
  entity: class {},
})
export class WorkplaceSchema
  extends BaseSchema<Workplace>
  implements Workplace
{
  @Attribute({})
  id: string;
  @Attribute({})
  address: string;
  @Attribute({})
  floor: number;
  @Attribute({})
  employees: number;
}

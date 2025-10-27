import { UserService } from './user.service';
import { UserResource } from './user.controller';
import { JsonApiModule } from '@tanisic/nest-japi';

export const UserModule = JsonApiModule.forFeature({
  resource: UserResource,
  providers: [UserService],
});

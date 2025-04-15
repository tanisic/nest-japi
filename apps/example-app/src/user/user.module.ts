import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResource } from './user.controller';
import { JsonApiModule } from 'nest-japi';

@Module({
  imports: [JsonApiModule.forFeature({ resource: UserResource })],
  providers: [UserService],
})
export class UserModule {}

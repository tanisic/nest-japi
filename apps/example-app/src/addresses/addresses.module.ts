import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JsonApiModule } from '@tanisic/nest-japi';
import { AddressResource } from './addresses.controller';

@Module({
  imports: [JsonApiModule.forFeature({ resource: AddressResource })],
  providers: [AddressesService],
})
export class AddressesModule {}

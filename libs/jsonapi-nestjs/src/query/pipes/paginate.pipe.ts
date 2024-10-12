import { OrderDefinition } from "@mikro-orm/core";
import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { PaginateParamService } from "../services/pagination-param.service";

@Injectable()
export class PaginatePipe implements PipeTransform {
  constructor(private paginateService: PaginateParamService) {}

  transform(value: any, _metadata: ArgumentMetadata): OrderDefinition<any> {
    return this.paginateService.transform(value);
  }
}

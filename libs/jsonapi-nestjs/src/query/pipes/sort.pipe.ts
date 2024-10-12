import { OrderDefinition } from "@mikro-orm/core";
import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { SortParamService } from "../services/sort-param.service";

@Injectable()
export class SortPipe implements PipeTransform {
  constructor(private sortParamService: SortParamService) {}

  transform(value: any, metadata: ArgumentMetadata): OrderDefinition<any> {
    return this.sortParamService.transform(value, metadata);
  }
}

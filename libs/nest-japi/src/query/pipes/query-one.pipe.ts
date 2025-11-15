import {
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { SparseFieldsService } from "../services/sparse-fields.service";
import { IncludeService } from "../services/include.service";
import { QueryParams } from "./query-all.pipe";

export interface SingleQueryParams
  extends Omit<QueryParams, "page" | "filter" | "sort"> {}

@Injectable()
export class QueryOnePipe implements PipeTransform<unknown, SingleQueryParams> {
  @Inject(SparseFieldsService)
  private sparseFieldsService!: SparseFieldsService;

  @Inject(IncludeService)
  private includeService!: IncludeService;

  transform(value: any, metadata: ArgumentMetadata): SingleQueryParams {
    if (metadata.type !== "query") {
      return value;
    }

    return {
      ...value,
      fields: this.sparseFieldsService.transform(value.fields),
      include: this.includeService.transform(value.include),
    };
  }
}

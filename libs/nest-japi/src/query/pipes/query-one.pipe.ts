import {
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { SortService } from "../services/sort.service";
import { SparseFieldsService } from "../services/sparse-fields.service";
import { IncludeService } from "../services/include.service";
import { QueryParams } from "./query-all.pipe";

export interface SingleQueryParams
  extends Omit<QueryParams, "page" | "filter"> {}

@Injectable()
export class QueryOnePipe implements PipeTransform<unknown, SingleQueryParams> {
  @Inject(SortService)
  private sortService!: SortService;

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
      sort: this.sortService.transform(value.sort),
      fields: this.sparseFieldsService.transform(value.fields),
      include: this.includeService.transform(value.include),
    };
  }
}

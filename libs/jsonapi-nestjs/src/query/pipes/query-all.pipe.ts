import {
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { SortDefinitions, SortService } from "../services/sort.service";
import {
  SparseFields,
  SparseFieldsService,
} from "../services/sparse-fields.service";
import {
  PaginateService,
  Pagination,
} from "../services/pagination-param.service";
import { Includes, IncludeService } from "../services/include.service";

export interface QueryParams {
  sort: SortDefinitions;
  fields: SparseFields;
  page: Pagination | null;
  include: Includes;
}

@Injectable()
export class QueryAllPipe implements PipeTransform<unknown, QueryParams> {
  @Inject(SortService)
  private sortService: SortService;

  @Inject(SparseFieldsService)
  private sparseFieldsService: SparseFieldsService;

  @Inject(PaginateService)
  private paginateService: PaginateService;

  @Inject(IncludeService)
  private includeService: IncludeService;

  transform(value: any, metadata: ArgumentMetadata): QueryParams {
    if (metadata.type !== "query") {
      return value;
    }

    return {
      sort: this.sortService.transform(value.sort),
      fields: this.sparseFieldsService.transform(value.fields),
      page: this.paginateService.transform(value.page),
      include: this.includeService.transform(value.include),
    };
  }
}

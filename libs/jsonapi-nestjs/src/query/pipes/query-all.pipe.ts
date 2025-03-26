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
import { FilterService } from "../services/filter.service";
import { FilterQuery } from "@mikro-orm/core";
import { JapiError } from "ts-japi";

export interface QueryParams {
  sort: SortDefinitions;
  fields: SparseFields;
  page: Pagination | null;
  include: Includes | null;
  filter: FilterQuery<any> | null;
}

@Injectable()
export class QueryAllPipe
  implements PipeTransform<Record<string, any>, QueryParams>
{
  @Inject(SortService)
  private sortService: SortService;

  @Inject(SparseFieldsService)
  private sparseFieldsService: SparseFieldsService;

  @Inject(PaginateService)
  private paginateService: PaginateService;

  @Inject(IncludeService)
  private includeService: IncludeService;

  @Inject(FilterService)
  private filterService: FilterService;

  transform(
    value: Record<string, any>,
    metadata: ArgumentMetadata,
  ): QueryParams {
    if (metadata.type !== "query") {
      return value as unknown as QueryParams;
    }

    let filter: FilterQuery<any> | null = null;

    if (value.filter) {
      const filterJson = this.parseFilter(value.filter);
      filter = this.filterService.transform(filterJson);
    }

    return {
      ...value,
      sort: this.sortService.transform(value.sort),
      fields: this.sparseFieldsService.transform(value.fields),
      page: this.paginateService.transform(value.page),
      include: this.includeService.transform(value.include),
      filter,
    };
  }

  parseFilter(filter: any): FilterQuery<unknown> {
    try {
      return JSON.parse(filter);
    } catch (err) {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: "Filter is not valid JSON object.",
      });
    }
  }
}

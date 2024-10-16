import { BadRequestException, Injectable } from "@nestjs/common";
import { JsonApiOptions } from "../../modules/json-api-options";
import { z } from "zod";

export type Pagination = {
  page: number;
  perPage: number;
};
const paginationSchema = z
  .object({
    number: z.coerce.number().int(),
    size: z.coerce.number().int(),
  })
  .strict()
  .or(z.undefined());

@Injectable()
export class PaginateParamService {
  maximumPerPage: number;

  constructor(private options: JsonApiOptions) {
    this.maximumPerPage =
      this.options.global.maxPaginationSize ||
      this.options.resource.maxPaginationSize ||
      50;
  }

  transform(value: any): Pagination | null {
    if (!value) {
      return null;
    }

    const parse = paginationSchema.safeParse(value?.page);

    if (parse.success) {
      if (!parse.data) return null;
      if (parse.data.size > this.maximumPerPage) {
        throw new BadRequestException(
          `Maximum page[size] is ${this.maximumPerPage}`,
        );
      }

      return {
        page: parse.data.number,
        perPage: parse.data.size,
      };
    }
    throw new BadRequestException(parse.error);
  }
}

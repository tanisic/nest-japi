import { Injectable } from "@nestjs/common";
import { JsonApiOptions } from "../../modules/json-api-options";
import { z } from "zod";
import { JapiError } from "ts-japi";
import { DEFAULT_PAGINATION_SIZE } from "../../constants";

export type Pagination = {
  number: number;
  size: number;
};
const paginationSchema = z
  .object({
    number: z.coerce.number().int(),
    size: z.coerce.number().int(),
  })
  .strict()
  .or(z.undefined());

@Injectable()
export class PaginateService {
  maximumPerPage: number;

  constructor(private options: JsonApiOptions) {
    this.maximumPerPage =
      this.options.resource.maxPaginationSize ||
      this.options.global.maxPaginationSize ||
      DEFAULT_PAGINATION_SIZE;
  }

  transform(value: any): Pagination | null {
    if (!value) {
      return null;
    }

    const parse = paginationSchema.safeParse(value);

    if (parse.success) {
      if (!parse.data) return null;
      if (parse.data.size > this.maximumPerPage) {
        throw new JapiError({
          status: "400",
          detail: `Maxiumum page size iz ${this.maximumPerPage} items per page.`,
          source: {
            parameter: "page",
          },
        });
      }

      const { number, size } = parse.data;

      return {
        number,
        size,
      };
    }
    throw new JapiError({
      status: "400",
      title: parse.error.name,
      detail: parse.error.errors[0].message,
      source: {
        parameter: "page",
      },
    });
  }
}

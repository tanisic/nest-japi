import { Injectable } from "@nestjs/common";
import { JsonApiOptions } from "../../modules/json-api-options";
import { z } from "zod";
import { JapiError } from "ts-japi";

export type Pagination = {
  number: number;
  size: number;
  offset: number;
  limit: number;
};
const paginationSchema = z
  .object({
    number: z.coerce
      .number()
      .int()
      .gte(1, "page[number] must be greater than 0."),
    size: z.coerce.number().int().gte(1, "page[size] must be greater than 0."),
  })
  .strict()
  .or(z.undefined());

@Injectable()
export class PaginateService {
  constructor(private options: JsonApiOptions) {}

  transform(value: any): Pagination | null {
    if (!value) {
      return null;
    }

    const parse = paginationSchema.safeParse(value);

    if (parse.success) {
      if (!parse.data) return null;
      if (parse.data.size > this.options.maxAllowedPagination) {
        throw new JapiError({
          status: "400",
          detail: `Maxiumum page size iz ${this.options.maxAllowedPagination} items per page.`,
          source: {
            parameter: "page",
          },
        });
      }

      const { number, size } = parse.data;

      const offset = (number - 1) * size;
      const limit = size;

      return {
        number,
        size,
        limit,
        offset,
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

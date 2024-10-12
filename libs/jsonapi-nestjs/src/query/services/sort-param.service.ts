import {
  EntityMetadata,
  OrderDefinition,
  QueryOrderMap,
  ReferenceKind,
} from "@mikro-orm/core";
import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { CURRENT_ENTITY_METADATA } from "../../constants";

@Injectable()
export class SortParamService {
  @Inject(CURRENT_ENTITY_METADATA)
  private entityMetadata: EntityMetadata;

  transform(value: any, _metadata: ArgumentMetadata): OrderDefinition<any> {
    if (!value) {
      return null;
    }

    const fields: string[] = value.split(",");
    const sortCriteria: OrderDefinition<any> = [];

    for (const field of fields) {
      const sortOrder = field.startsWith("-") ? "DESC" : "ASC";
      const fieldName = field.startsWith("-") ? field.substring(1) : field;

      const fieldParts = fieldName.split(".");

      if (fieldParts.length > 1) {
        this.validateRelation(fieldParts);
        const criteria = this.createObjectChain(fieldParts, sortOrder);
        sortCriteria.push(criteria);
      } else {
        this.validateField(fieldName);
        sortCriteria.push({ [fieldName]: sortOrder });
      }
    }

    return sortCriteria;
  }

  createObjectChain(
    fields: string[],
    sort: "DESC" | "ASC",
  ): QueryOrderMap<any> {
    return fields.reduceRight((acc, field) => ({ [field]: acc }) as any, sort);
  }

  private validateField(field: string) {
    const property = this.entityMetadata.properties[field];

    if (!property) {
      throw new BadRequestException(`Invalid sort field: ${field}`);
    }

    if (property.kind !== ReferenceKind.SCALAR) {
      throw new BadRequestException(
        `Invalid sort field: Cannot sort by relation ${field}, missing relation field.`,
      );
    }
  }

  validateRelation(parts: string[]) {
    let currentEntityMetadata = this.entityMetadata;

    for (const [index, part] of parts.entries()) {
      const property = currentEntityMetadata.properties[part];
      if (!property) {
        throw new BadRequestException(`Invalid relation field: ${part}`);
      }

      if (property.kind) {
        if (
          index === parts.length - 1 &&
          property.kind === ReferenceKind.SCALAR
        ) {
          return;
        }

        if (
          ![
            ReferenceKind.MANY_TO_ONE,
            ReferenceKind.ONE_TO_MANY,
            ReferenceKind.ONE_TO_ONE,
            ReferenceKind.MANY_TO_MANY,
          ].includes(property.kind)
        ) {
          throw new BadRequestException(
            `Field ${part} is not a valid relation`,
          );
        }
        currentEntityMetadata = property.targetMeta;
        if (!currentEntityMetadata) {
          throw new BadRequestException(
            `Invalid relation target for field: ${part}`,
          );
        }
      }
    }
  }
}

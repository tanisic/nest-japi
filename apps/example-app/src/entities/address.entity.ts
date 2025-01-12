import { Entity, Property, PrimaryKey, OneToOne } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ tableName: 'addresses' })
export class Address {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, { nullable: true })
  user?: User;

  @Property()
  city!: string;

  @Property()
  street!: string;

  @Property()
  streetNumber!: string;

  @Property()
  country!: string;

  @Property()
  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}

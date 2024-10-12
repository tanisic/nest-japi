import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';
import { User } from './user.entity';

@Entity({ tableName: 'pictures' })
export class Picture {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToOne(() => User)
  owner!: User;
}

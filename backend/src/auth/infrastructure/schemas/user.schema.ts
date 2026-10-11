import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserModel>;

/**
 * ADR 0021 / ADR 0022: Users collection holding owner and admin users.
 * Credentials use email, bcrypt passwordHash, role, and a tokenVersion
 * for instantaneous session invalidation upon password/email changes or deactivation.
 */
@Schema({
  collection: 'users',
  timestamps: true,
})
export class UserModel {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: ['owner', 'admin'], default: 'admin' })
  role!: 'owner' | 'admin';

  @Prop({ required: true, default: true })
  active!: boolean;

  @Prop({ required: true, default: 0 })
  tokenVersion!: number;

  @Prop({ required: true, default: false })
  mustChangePassword!: boolean;

  @Prop({ type: String, default: null })
  createdBy?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<AdminModel>;

/**
 * ADR 0004 / ADR 0006: the admin credential lives in MongoDB (hash only),
 * never in an env var. Bootstrapped once from ADMIN_USERNAME/ADMIN_PASSWORD
 * when this collection is empty.
 */
@Schema({
  collection: 'admins',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AdminModel {
  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  createdAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(AdminModel);

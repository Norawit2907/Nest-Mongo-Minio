import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReservesDocument = HydratedDocument<ReservesMongo>;

@Schema({ timestamps: true, collection: 'reserves' })
export class ReservesMongo {
  @Prop({ required: true })
  wat_id: string; 

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  noti_id: string;

  @Prop({ default: Date.now })
  reservation_date: string;

  @Prop({ default: Date.now })
  cremation_date: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  addons: string[];

}

export const ReservesSchema = SchemaFactory.createForClass(ReservesMongo);

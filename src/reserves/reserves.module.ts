import { Module } from '@nestjs/common';
import { ReservesController } from './reserves.controller';
import { ReservesService } from './reserves.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservesMongo, ReservesSchema } from 'src/server-adaptor-mongo/reserves.schema.mongo';
import { WatMongo, WatSchema } from 'src/server-adaptor-mongo/wat.schema.mongo';
import { NotificationModule } from 'src/notification/notification.module';
import { UserMongo,UserSchema } from 'src/server-adaptor-mongo/user.schema.mongo';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        JwtModule,
        MongooseModule.forFeature([{ name: ReservesMongo.name, schema: ReservesSchema }]),
        MongooseModule.forFeature([{ name: WatMongo.name, schema: WatSchema }]),
        MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
        UsersModule,
        NotificationModule,
      ],
  controllers: [ReservesController],
  providers: [ReservesService],
})
export class ReservesModule {}

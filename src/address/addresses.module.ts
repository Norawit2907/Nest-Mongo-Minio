import { Module } from '@nestjs/common';
import { AddressesController} from './addresses.controller';
import { AddressesService } from './addresses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressMongo, AddressSchema } from 'src/server-adaptor-mongo/address.schema.mongo';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { WatMongo, WatSchema } from 'src/server-adaptor-mongo/wat.schema.mongo';
import { WatsModule } from 'src/wats/wats.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AddressMongo.name, schema:AddressSchema }]),
    MongooseModule.forFeature([{ name: WatMongo.name, schema: WatSchema }]),
    GeocodingModule,
    WatsModule,
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService]
})

export class AddressesModule {}

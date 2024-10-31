import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { max, min } from 'class-validator';
import mongoose, { Model } from 'mongoose';
import { Address } from 'src/model/address.model';
import { AddressDocument, AddressMongo } from 'src/server-adaptor-mongo/address.schema.mongo';
import { CreateAddressDto } from './dto/create-addresses.dto';
import { UpdateAddressDto } from './dto/update-addresses.dto';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import { WatMongo } from 'src/server-adaptor-mongo/wat.schema.mongo';
import { watch } from 'fs';
import { WatsService } from 'src/wats/wats.service';

@Injectable()
export class AddressesService {
  constructor(@InjectModel('AddressMongo') private addressModel: Model<AddressMongo>,
    private readonly geocodingService: GeocodingService,
    private readonly WatsService: WatsService,
    @InjectModel('WatMongo') private watModel: Model<WatMongo>,
  ) { }

  async createAddress(createaddressDto: CreateAddressDto): Promise<Address> {

    // if(this.getAddressByWatId(createaddressDto.wat_id)){
    //   throw new NotFoundException("Address already exist")
    // }
    const wat = await this.WatsService.getWatById(createaddressDto.wat_id);

    if (!wat) {
      throw new NotFoundException('Wat not found');
    }

    const watName = wat.name;

    const address_lat_lng = await this.geocodingService.getCoordinates(watName);

    const newAddress = new this.addressModel(
      {
        ...createaddressDto,
        latitude: address_lat_lng.lat,
        longtitude: address_lat_lng.lng,
      }
    );
    newAddress.save();
    return this.toEntity(newAddress);
  }

  async getAddressById(id: string): Promise<Address | null> {
    const existUser = await this.addressModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    return existUser ? this.toEntity(existUser) : null;
  }

  async getAddressByWatId(id: string): Promise<Address | null> {
    const existAddress = await this.addressModel.findOne({
      wat_id: id
    });
    return existAddress ? this.toEntity(existAddress) : null
  }

  async updateAddressByWatId(wat_id: string, updateAddressDto: UpdateAddressDto): Promise<Address | null> {
    // Validate wat_id
    if (!wat_id) {
      throw new BadRequestException('Invalid wat_id');
    }
    const existAddress = await this.getAddressByWatId(wat_id);
    const wat = await this.WatsService.getWatById(wat_id)
    let address_lat_lng;
    // try {
    //   address_lat_lng = await this.geocodingService.getCoordinates(updateAddressDto.address);
    // } catch (error) {
      try{
        console.log(wat.name)
        address_lat_lng = await this.geocodingService.getCoordinates(wat.name);
        console.log(address_lat_lng);
      }
      catch(err){
        throw new InternalServerErrorException('Failed to fetch coordinates');
      }
    // }
  
    // Include coordinates in the update DTO if they are retrieved
    const updatedData = {
      ...updateAddressDto,
      ...(address_lat_lng && { latitude: address_lat_lng.lat, longtitude: address_lat_lng.lng }),
    };
  
    const updatedAddress = await this.addressModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(existAddress.id)
      },
      updatedData,
      
      { new: true },
    )
  
    return updatedAddress ? this.toEntity(updatedAddress) : null;
  }

  async updateAddressById(
    id: string,
    updateaddressDto: UpdateAddressDto,
  ): Promise<Address | null> {
    
    const updatedUser = await this.addressModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
      },
      updateaddressDto,
      { new: true },
    );

    return updatedUser ? this.toEntity(updatedUser) : null;
  }
  async listAddresses(): Promise<Address[]> {
    const allUser = await this.addressModel.find({});
    return allUser.map((doc) => this.toEntity(doc));
  }

  async deleteAddressById(id: string): Promise<null> {
    await this.addressModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return null;
  }


  toEntity(doc: AddressDocument): Address {
    return {
      id: doc._id.toHexString(),
      wat_id: doc.wat_id,
      address: doc.address,
      street: doc.street,
      alley: doc.alley,
      province: doc.province,
      distrinct: doc.distrinct,
      sub_distrinct: doc.sub_distrinct,
      postalCode: doc.postalCode,
      latitude: doc.latitude,
      longtitude: doc.longtitude,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

}

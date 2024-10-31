import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ReservesDto } from './dto/reserves.dto';
import { ReservesMongo } from 'src/server-adaptor-mongo/reserves.schema.mongo';
import { WatMongo } from 'src/server-adaptor-mongo/wat.schema.mongo';
import { UserMongo } from 'src/server-adaptor-mongo/user.schema.mongo';
import { NotificationService } from 'src/notification/notification.service';
import { Reserves } from 'src/model/reserves.model';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReservesService {
  constructor(
    @InjectModel('ReservesMongo') private reservesModel: Model<ReservesMongo>,
    @InjectModel('WatMongo') private watModel: Model<WatMongo>,
    @InjectModel('UserMongo') private userModel: Model<UserMongo>,
    private readonly notificationService: NotificationService,
    private readonly userServices: UsersService,
  ) { }


  async findAll(): Promise<ReservesMongo[]> {
    return this.reservesModel.find().exec();
  }


  async findOne(id: string): Promise<ReservesMongo> {
    const reserve = await this.reservesModel.findById(id).exec();
    if (!reserve) {
      throw new NotFoundException(`Reserve with ID ${id} not found`);
    }
    return reserve;
  }

  async getReservationsByWatId(id: string): Promise<ReservesMongo[]> {
    const existingReservations = await this.reservesModel.find({
      wat_id: id,
    });

    if (existingReservations.length === 0) {
      throw new ConflictException(`There are no reservations for Wat ID ${id}`);
    }

    return existingReservations;
  }

  async getReservationsAmount(id: string): Promise<{ [date: string]: number }> {
    const existingReservations = await this.getReservationsByWatId(id);
    const reservationCounts: { [date: string]: number } = {};

    existingReservations.forEach(reservation => {
      const startDate = new Date(reservation.reservation_date);
      const duration = parseInt(reservation.duration, 10);

      for (let i = 0; i < duration; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Increment the count for this date
        if (reservationCounts[dateString]) {
          reservationCounts[dateString]++;
        } else {
          reservationCounts[dateString] = 1;
        }
      }
    });

    return reservationCounts;
  }

  async getCremationsAmount(id: string): Promise<{ [date: string]: number }> {
    const existingReservations = await this.getReservationsByWatId(id);
    const cremationCounts: { [date: string]: number } = {};

    existingReservations.forEach(reservation => {
      const cremationDate = new Date(reservation.cremation_date);

      const dateString = cremationDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      if (cremationCounts[dateString]) {
        cremationCounts[dateString]++;
      } else {
        cremationCounts[dateString] = 1;
      }
    });

    return cremationCounts;
  }



  async create(createReserveDto: ReservesDto): Promise<ReservesMongo> {

    const reservationDate = new Date(createReserveDto.reservation_date);
    const cremationDate = new Date(createReserveDto.cremation_date);
    const durationDays = Number(createReserveDto.duration);
    const endDate = new Date(reservationDate);
    const nowDate = new Date();
    const wat = await this.watModel.findOne({_id: new mongoose.Types.ObjectId(createReserveDto.wat_id)});
    const user = await this.userModel.findOne({_id: new mongoose.Types.ObjectId(createReserveDto.user_id)});
    // const sender = createReserveDto.sender;
    let owner_noti_id = createReserveDto.wat_id;

    if (reservationDate < nowDate) {
      throw new ConflictException("Reservation date cannot be in the past.");
    }

    // if (sender === 'user') {
    //   owner_noti_id = createReserveDto.user_id;
    // }
    // if (sender === 'wat') {
    //   owner_noti_id = createReserveDto.wat_id;
    // }
    endDate.setDate(reservationDate.getDate() + durationDays);

    if (cremationDate < reservationDate ||
      (reservationDate <= cremationDate && cremationDate <= endDate)) {
      throw new ConflictException('Cremation date cannot be before reservation date.');
    }
    
    const existingReservations = await this.reservesModel.find({
      wat_id: createReserveDto.wat_id,
      reservation_date: {
        $gte: reservationDate.toISOString().split('T')[0],
        $lt: endDate.toISOString().split('T')[0],
      },
    });

    const existingCremations = await this.reservesModel.find({
      wat_id: createReserveDto.wat_id,
      cremation_date: createReserveDto.cremation_date
    });

    
    const maxWorkload = await this.watModel.findOne({
      _id: new mongoose.Types.ObjectId(createReserveDto.wat_id),
    })
    
    
    if (existingReservations.length >= maxWorkload.max_workload) {
      throw new ConflictException('A reservation with the same wat_id and overlapping dates already exists.');
    }

    if (existingCremations.length >= maxWorkload.max_workload) {
      throw new ConflictException('A cremation with the same wat_id and overlapping dates already exists.');
    }

    await this.notificationService.createNotification({
      title: `คุณมีการจองใหม่จาก ${user.firstname} ${user.lastname}`,
      description: `วันจัดงาน : ${createReserveDto.reservation_date}
                    ระยะเวลา : ${createReserveDto.duration}
                    วันณาปนกิจ : ${createReserveDto.cremation_date}
                    Addons : ${createReserveDto.addons} 
                    ราคา : ${createReserveDto.price}`,
      owner_id: createReserveDto.wat_id,
    });

    await this.notificationService.createNotification({
      title: `การจองของคุณสำเร็จและรอการยืนยันจาก${wat.name}`,
      description: `วันจัดงาน : ${createReserveDto.reservation_date}
                    ระยะเวลา : ${createReserveDto.duration}
                    วันณาปนกิจ : ${createReserveDto.cremation_date}
                    Addons : ${createReserveDto.addons} 
                    ราคา : ${createReserveDto.price}`,
      owner_id: createReserveDto.user_id,
    });
    
    const newReserve = new this.reservesModel( createReserveDto );
    return newReserve.save();
  }

  async update(
    id: string,
    updateReserveDto: Partial<ReservesDto>,
  ): Promise<ReservesMongo> {
    const updatedReserve = await this.reservesModel
    .findByIdAndUpdate(id, updateReserveDto, { new: true })
    .exec();
    
    if (!updatedReserve) {
      throw new NotFoundException(`Reserve with ID ${id} not found`);
    }
    
    const wat = await this.watModel.findOne({_id: new mongoose.Types.ObjectId(updateReserveDto.wat_id)});
    const user = await this.userModel.findOne({_id: new mongoose.Types.ObjectId(updateReserveDto.user_id)});
    
    if(updateReserveDto.status === 'accept') {
      console.log(updateReserveDto.status);
      console.log(wat,user)
      await this.notificationService.createNotification({
        title: `การจองของคุณได้รับการยืนยันจาก${wat.name}`,
        description: `วันจัดงาน : ${updateReserveDto.reservation_date}
                      ระยะเวลา : ${updateReserveDto.duration}
                      วันณาปนกิจ : ${updateReserveDto.cremation_date}
                      Addons : ${updateReserveDto.addons} 
                      ราคา : ${updateReserveDto.price}`,
        owner_id: updateReserveDto.user_id,
      })
      
      await this.notificationService.createNotification({
        title: `คุณได้ยืนยันการจองของ ${user.firstname} ${user.lastname}`,
        description: `วันจัดงาน : ${updateReserveDto.reservation_date}
        ระยะเวลา : ${updateReserveDto.duration}
        วันณาปนกิจ : ${updateReserveDto.cremation_date}
        Addons : ${updateReserveDto.addons} 
        ราคา : ${updateReserveDto.price}`,
        owner_id: updateReserveDto.wat_id,
      })

      
    } else if(updateReserveDto.status === 'passed') {
      await this.notificationService.createNotification({
        title: `งานของคุณได้จัดเสร็จสิ้นแล้ว, ขอแสดงความเสียใจกับญาติผู้เสียชีวิตด้วยค่ะ`,
        description: `ขอบคุณที่ใช้บริการของเรา Meur-Online ยินดีให้บริการค่ะ ไว้มาใช้บริการใหม่อีกครั้งนะคะ`,
        owner_id: updateReserveDto.user_id,
      })

      await this.notificationService.createNotification({
        title: `พิธีศพได้เสร็จสิ้นลงแล้ว`,
        description: `เงินจำนวน ${updateReserveDto.price} บาท ได้ถูกโอนเข้าบัญชีของวัดแล้วค่ะ`,
        owner_id: updateReserveDto.wat_id,
      })


    } else if(updateReserveDto.status === 'reject' && updateReserveDto.sender === 'user') {
      await this.notificationService.createNotification({
        title: `การจองของคุณถูกปฏิเสธจาก${wat.name}`,
        description: `ขอแสดงความเสียใจด้วยค่ะ ลองหาวัดจองใหม่อีกครั้งนะคะ`,
        owner_id: updateReserveDto.user_id,
      })
      
      await this.notificationService.createNotification({
        title: `คุณได้ปฏิเสธการจองของ ${user.firstname} ${user.lastname}`,
        description: `หากเปลี่ยนใจหรือผิดพลาดในกรณีใดๆก็ตาม สามารถติดต่อ ${user.firstname} ${user.lastname} ได้ที่เบอร์โทรศัพท์ ${user.phoneNumber} ค่ะ`,
        owner_id: updateReserveDto.wat_id,
      })


    } else if(updateReserveDto.status === 'reject' && updateReserveDto.sender === 'wat') {
      await this.notificationService.createNotification({
        title: `คุณได้ทำการยกเลิกการจองของ ${wat.name}`,
        description: `เงินในการจองจะถูกคืนให้คุณ ${user.firstname} ${user.lastname} ในเร็วๆนี้ค่ะ`,
        owner_id: updateReserveDto.user_id,
      })
      
      await this.notificationService.createNotification({
        title: `${user.firstname} ${user.lastname} ได้ยกเลิกการจอง`,
        description: `หากมีปัญหาใดๆ สามารถติดต่อ ${user.firstname} ${user.lastname} ได้ที่เบอร์โทรศัพท์ ${user.phoneNumber} ค่ะ`,
        owner_id: updateReserveDto.wat_id,
      })
      
    }


    return updatedReserve;
  }



  async delete(id: string): Promise<{ message: string }> {
    const result = await this.reservesModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Reserve with ID ${id} not found`);
    }
    return { message: `Reserve with ID ${id} deleted successfully` };
  }
}

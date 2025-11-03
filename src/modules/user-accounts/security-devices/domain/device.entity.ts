import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model } from 'mongoose';
import { DeviceInputDto } from '../api/input-dto/device.input-dto';

@Schema({ timestamps: true })
export class Device {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  jti: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  userAgent: string;

  @Prop({ type: Date, required: true })
  lastActive: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  static createInstance(dto: DeviceInputDto): DeviceDocument {
    const device = new this();

    device.userId = dto.userId;
    device.deviceId = dto.deviceId;
    device.jti = dto.jti;
    device.ip = dto.ip;
    device.userAgent = dto.userAgent;
    device.expiresAt = dto.expiresAt;
    device.lastActive = new Date();

    return device as DeviceDocument;
  }

  updateSession(expiresAt: Date, jti: string) {
    this.expiresAt = expiresAt;
    this.jti = jti;
    this.lastActive = new Date();
  }
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.loadClass(Device);

export type DeviceDocument = HydratedDocument<Device>;

export type DeviceModelType = Model<DeviceDocument> & typeof Device;

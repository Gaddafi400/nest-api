import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { Avatar } from './schemas/avatar.schema';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class UserService {
  private readonly avatarDirectory = path.join(__dirname, '../../avatars');

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Avatar.name) private avatarModel: Model<Avatar>,
    private jwtService: JwtService,
    private httpService: HttpService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
    const { name, email, password } = signUpDto;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
      });

      // Emit an event to RabbitMQ to send the welcome email
      this.rabbitMQService.sendEmail({
        to: email,
        subject: 'Welcome to Our App',
        text: `Hello ${name}, welcome to our app!`,
      });

      const token = this.jwtService.sign({ id: user._id });

      return { token };
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((e: any) => e.message);
        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      }
      if (error.code === 11000) {
        throw new BadRequestException('Duplicate key error');
      }
      throw new InternalServerErrorException(
        `Failed to sign up: ${error.message}`,
      );
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    const { email, password } = loginDto;

    try {
      const user = await this.userModel.findOne({ email });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);

      if (!isPasswordMatched) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = this.jwtService.sign({ id: user._id });

      return { token };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to login: ${error.message}`,
      );
    }
  }

  async getUserById(userId: number): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`https://reqres.in/api/users/${userId}`),
      );
      return response.data.data;
    } catch (error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  private async ensureAvatarDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.avatarDirectory, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create avatar directory: ${error.message}`,
      );
    }
  }

  private async calculateImageHash(imageBuffer: Buffer): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(imageBuffer);
    return hash.digest('hex');
  }

  private async saveImageToFileSystem(
    filePath: string,
    imageBuffer: Buffer,
  ): Promise<void> {
    try {
      await this.ensureAvatarDirectoryExists();
      await fs.writeFile(filePath, imageBuffer);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to save the avatar image: ${error.message}`,
      );
    }
  }

  private async convertToBase64(filePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(filePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to read the avatar image file: ${error.message}`,
      );
    }
  }

  async getAvatarByUserId(userId: number): Promise<string> {
    try {
      const existingAvatar = await this.avatarModel.findOne({ userId });

      if (existingAvatar) {
        return this.convertToBase64(existingAvatar.filePath);
      }

      const response = await lastValueFrom(
        this.httpService.get(`https://reqres.in/api/users/${userId}`),
      );

      const avatarUrl = response.data.data.avatar;

      if (!avatarUrl) {
        throw new NotFoundException(`Avatar for user ${userId} not found`);
      }

      const avatarResponse = await lastValueFrom(
        this.httpService.get(avatarUrl, { responseType: 'arraybuffer' }),
      );
      const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');
      const hash = await this.calculateImageHash(avatarBuffer);
      const filePath = path.join(this.avatarDirectory, `${userId}-${hash}.png`);
      await this.saveImageToFileSystem(filePath, avatarBuffer);
      await this.avatarModel.create({ userId, hash, filePath });
      return avatarBuffer.toString('base64');
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException({
          message: `Invalid userId format: ${error.value}`,
        });
      }
      throw new InternalServerErrorException(
        `Failed to retrieve or save the avatar image: ${error.message}`,
      );
    }
  }

  async deleteAvatarByUserId(userId: number): Promise<void> {
    try {
      const avatar = await this.avatarModel.findOne({ userId });

      if (!avatar) {
        throw new NotFoundException(`Avatar for user ${userId} not found`);
      }

      await fs.unlink(avatar.filePath);
      await this.avatarModel.deleteOne({ userId });
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException({
          message: `Invalid userId format: ${error.value}`,
        });
      }
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`Avatar file not found: ${error.message}`);
      }
      throw new InternalServerErrorException(
        `Failed to delete the avatar: ${error.message}`,
      );
    }
  }
}

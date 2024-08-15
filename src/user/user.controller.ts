import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  NotFoundException,
  UseFilters,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { MongooseExceptionFilter } from '../filters/mongoose-exception.filter';

@Controller('api/user')
@UseFilters(MongooseExceptionFilter)
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<{ token: string }> {
    return this.userService.signUp(signUpDto);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
    return this.userService.login(loginDto);
  }

  @Get('/:userId')
  async getUserById(@Param('userId') userId: number): Promise<any> {
    return this.userService.getUserById(userId);
  }

  @Get('/:userId/avatar')
  async getUserAvatar(
    @Param('userId') userId: number,
  ): Promise<{ avatar: string }> {
    try {
      const avatarBase64 = await this.userService.getAvatarByUserId(userId);
      return { avatar: avatarBase64 };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete('/:userId/avatar')
  deleteAvatar(@Param('userId') userId: number): Promise<void> {
    return this.userService.deleteAvatarByUserId(userId);
  }
}

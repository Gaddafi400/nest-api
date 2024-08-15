import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            signUp: jest.fn(),
            login: jest.fn(),
            getUserById: jest.fn(),
            getAvatarByUserId: jest.fn(),
            deleteAvatarByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('signUp', () => {
    it('should sign up a user and return a token', async () => {
      const signUpDto: SignUpDto = {
        name: 'test',
        email: 'gaddafi@example.com',
        password: 'password',
      };
      const token = 'test-token';
      jest.spyOn(userService, 'signUp').mockResolvedValueOnce({ token });

      const result = await userController.signUp(signUpDto);
      expect(result).toEqual({ token });
      expect(userService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('login', () => {
    it('should log in a user and return a token', async () => {
      const loginDto: LoginDto = {
        email: 'gaddafi@example.com',
        password: 'password',
      };
      const token = 'test-token';
      jest.spyOn(userService, 'login').mockResolvedValueOnce({ token });

      const result = await userController.login(loginDto);
      expect(result).toEqual({ token });
      expect(userService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const userId = 1;
      const user = { id: userId, email: 'gaddafi@example.com' };
      jest.spyOn(userService, 'getUserById').mockResolvedValueOnce(user);

      const result = await userController.getUserById(userId);
      expect(result).toEqual(user);
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserAvatar', () => {
    it('should return a user avatar as base64 string', async () => {
      const userId = 1;
      const avatarBase64 = 'base64-encoded-string';
      jest
        .spyOn(userService, 'getAvatarByUserId')
        .mockResolvedValueOnce(avatarBase64);

      const result = await userController.getUserAvatar(userId);
      expect(result).toEqual({ avatar: avatarBase64 });
      expect(userService.getAvatarByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when avatar not found', async () => {
      const userId = 1;
      jest
        .spyOn(userService, 'getAvatarByUserId')
        .mockRejectedValueOnce(new Error('Avatar not found'));

      await expect(userController.getUserAvatar(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should delete the avatar for a given user ID', async () => {
      const userId = 1;
      jest
        .spyOn(userService, 'deleteAvatarByUserId')
        .mockResolvedValueOnce(undefined);

      await userController.deleteAvatar(userId);
      expect(userService.deleteAvatarByUserId).toHaveBeenCalledWith(userId);
    });
  });
});

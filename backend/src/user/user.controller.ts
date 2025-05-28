import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Sign up a new user with email & password
  @Post('signup')
  async signUp(
    @Body() { email, password, profileImage }: { email: string; password: string; profileImage?: string },
  ) {
    const initial = email.slice(0, 2).toUpperCase(); // Extract initials from email
    return this.userService.createUser({
      email,
      password,
      profileImage,
      coins: 0,
    });
  }

  // Get user by email
  @Get(':email')
  async getUser(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  // Update user coins
  @Patch('update-coins')
  async updateCoins(
    @Body() { userId, amount }: { userId: string; amount: number },
  ) {
    return this.userService.updateUserCoins(userId, amount);
  }
}

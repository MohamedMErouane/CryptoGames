import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Email/Password Signup
  @Post('signup')
  async signUp(@Body() { email, password }: { email: string; password: string }) {
    return this.authService.signUp(email, password);
  }

  // Email/Password Login
  @Post('login')
  async login(@Body() { email, password }: { email: string; password: string }) {
    return this.authService.login(email, password);
  }

  
  @Get('google')
@UseGuards(AuthGuard('google'))  // Will redirect to Google
googleAuth() {
  return { msg: 'Google Authentication Redirect' };  // Placeholder for logging
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleAuthRedirect(@Req() req, @Res() res) {
  // Generate token based on user information
  const token = this.authService.generateToken(req.user);

  // Send the token in the URL or as a response body
  return res.redirect(`http://localhost:3000/Home?token=${token}`);
}


}

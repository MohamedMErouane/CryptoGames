import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async signUp(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        coins: 0,
      },
    });

    return this.generateToken(newUser);
  }

  async login(email: string, password: string) {
    console.log(`Attempting login for email: ${email}`);
  
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Incorrect password');
      throw new UnauthorizedException('Invalid credentials');
    }
  
    console.log('User authenticated successfully');
    return this.generateToken(user);
  }
  

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          coins: 0,
        },
      });
    }

    return this.generateToken(user);
  }

  generateToken(user: any) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }
}

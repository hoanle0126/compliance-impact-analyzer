import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'analyst@impactlens.local', description: 'User corporate email' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty()
  password!: string;
}

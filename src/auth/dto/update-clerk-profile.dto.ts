import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClerkProfileDto {
  @ApiProperty({
    description: 'Nomor telepon user (optional)',
    example: '081234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Nomor telepon terlalu panjang' })
  phoneNumber?: string;
}

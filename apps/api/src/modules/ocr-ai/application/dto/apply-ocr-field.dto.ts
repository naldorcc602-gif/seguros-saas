import { IsIn, IsString, MinLength } from 'class-validator';

const APPLICABLE_FIELDS = ['vehiclePlate', 'renavam', 'chassis', 'vehicleModel', 'clientDocument', 'clientName'];

export class ApplyOcrFieldDto {
  @IsIn(APPLICABLE_FIELDS)
  targetField!: string;

  @IsString()
  @MinLength(1)
  value!: string;
}

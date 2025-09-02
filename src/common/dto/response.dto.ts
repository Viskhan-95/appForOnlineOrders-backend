import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ description: 'Сообщение об успешном выполнении' })
  message: string;

  @ApiProperty({ description: 'Статус ответа' })
  status: 'success';

  @ApiProperty({ description: 'Временная метка' })
  timestamp: string;

  constructor(message: string) {
    this.message = message;
    this.status = 'success';
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Сообщение об ошибке' })
  message: string;

  @ApiProperty({ description: 'Код ошибки' })
  error: string;

  @ApiProperty({ description: 'HTTP статус код' })
  statusCode: number;

  @ApiProperty({ description: 'Временная метка' })
  timestamp: string;

  @ApiProperty({ description: 'Дополнительные детали ошибки', required: false })
  details?: unknown;

  constructor(
    message: string,
    error: string,
    statusCode: number,
    details?: unknown,
  ) {
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Массив данных' })
  data: T[];

  @ApiProperty({ description: 'Общее количество элементов' })
  total: number;

  @ApiProperty({ description: 'Текущая страница' })
  page: number;

  @ApiProperty({ description: 'Размер страницы' })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

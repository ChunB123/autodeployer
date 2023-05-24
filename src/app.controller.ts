import { Controller, Get, Redirect, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller()
@ApiExcludeController()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/api') // Redirect the root URL to the Swagger endpoint
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getRoot(): void {}
}

import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ClientService],
})
export class ClientModule {}

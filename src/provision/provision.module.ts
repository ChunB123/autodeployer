import { Module } from '@nestjs/common';
import { ProvisionService } from './provision.service';
import { ClientService } from 'src/client/client.service';
import { ClientModule } from 'src/client/client.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ClientModule, HttpModule],
  providers: [ProvisionService, ClientService],
})
export class ProvisionModule {}

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Credentials } from 'src/interfaces/Credentials';
import { StatusBody } from './models/StatusBody';
import {
  RequestType,
  Service,
  RegistrationBody,
} from './models/RegistrationBody';
import { updateJob } from 'src/database/db-functions';
import { ResponseStatus } from 'src/provision/models/response.model';
import { CredentialsBody } from './models/CredentialsBody';

@Injectable()
export class ClientService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(ClientService.name);

  async sendStatus(
    operationType: string,
    jobId: any,
    projectId: any,
    status: any,
    message: any,
  ) {
    const statusBody: StatusBody = {
      service_type: process.env.SERVICE_NAME,
      operation_type: operationType,
      job_id: jobId,
      project_id: projectId,
      status: status,
      message: message,
    };
    if (operationType == 'PROVISION') {
      updateJob(projectId, jobId, ResponseStatus.FAILED, '', '');
    }
    this.sendProvisionStatus(statusBody);
  }

  /**
   * Method to register the service with controller
   */
  async registerService() {
    const BASE_URL = process.env.CONTROLLER_API_URL;
    const ENDPOINT = process.env.CONTROLLER_ENDPOINT_REGISTER;
    const URL = BASE_URL + ENDPOINT;

    const services: Service[] = [];
    let service: Service;

    //provision services
    service = {
      service_name: 'provision',
      request_type: RequestType.POST,
      service_uri: '/:version/provision',
    };
    services.push(service);

    //deployment services
    service = {
      service_name: 'deployment',
      request_type: RequestType.POST,
      service_uri: '/:version/deployment',
    };

    //provision-deployment services
    service = {
      service_name: 'provisiondeployment',
      request_type: RequestType.POST,
      service_uri: '/:version',
    };
    services.push(service);

    // creating registration body
    const body: RegistrationBody = {
      service_type: process.env.SERVICE_NAME,
      host_name: process.env.SERVICE_URL,
      services: services,
    };

    try {
      this.logger.log(`Registering with controller: ${URL}`);
      this.logger.debug(JSON.stringify(body, null, 2));
      const response = await firstValueFrom(this.httpService.post(URL, body));
      if (response.status != 200) {
        throw new Error(
          `Received ${response.status} status code from controller`,
        );
      }
    } catch (err) {
      this.logger.error('Registration Failed!');
      this.logger.error(err.message);
      return;
      // throw new Error('Unable to register service');
    }
    this.logger.log('Registration Successful!');
  }

  /**
   * Method to get credentials from the controller
   * @param projectId The Id of the project
   * @param jobId The Id of the job
   * @returns Credentials object
   * @throws Error if unable to fetch credentials
   */
  async getCredentials(projectId: string, jobId: string): Promise<Credentials> {
    const BASE_URL = process.env.CONTROLLER_API_URL;
    const ENDPOINT = process.env.CONTROLLER_ENDPOINT_CREDENTIAL;
    const URL = BASE_URL + ENDPOINT;
    const queryParams = { 'project-id': projectId, 'job-id': jobId };

    try {
      this.logger.log(`Getting credentials: ${URL}`);
      const response = await firstValueFrom(
        this.httpService.get(URL, { params: queryParams }),
      );
      const temp = response.data as CredentialsBody;
      this.logger.debug(JSON.stringify(temp, null, 2));
      const credentials: Credentials = {
        accessKey: temp.client_id,
        password: temp.client_secret,
        token: temp.session_token,
      };
      this.logger.debug(JSON.stringify(credentials, null, 2));
      return credentials;
    } catch (err) {
      this.logger.error('Error in fetching credentials: ', err.message);
      throw new Error('Unable to fetch credentials');
    }
  }

  /**
   * Method to send provision status to the controller
   * @param body StatusBody object ot send in status
   * @throws Error if unable to send status
   */
  sendProvisionStatus = async (body: StatusBody) => {
    const BASE_URL = process.env.CONTROLLER_API_URL;
    const ENDPOINT = process.env.CONTROLLER_ENDPOINT_STATUS;
    const URL = BASE_URL + ENDPOINT;

    this.logger.log(`Sending provision status: ${URL}`);
    this.logger.debug(JSON.stringify(body, null, 2));

    try {
      const response = await firstValueFrom(this.httpService.post(URL, body));
      // this.logger.debug('Response: ' + JSON.stringify(response, null, 2));
    } catch (err) {
      this.logger.error('Error in sending provision status ', err.message);
      throw new Error('Unable to send provision status');
    }
  };
}

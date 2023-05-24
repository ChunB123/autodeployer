import { Injectable, Logger } from '@nestjs/common';
import { ProvisionResponse, ResponseStatus } from './models/response.model';
import { ProvisionRequest, ProvisionRequestV2 } from './models/request.model';
import { AwsCredentials } from './models/providerModels/AwsCredentials.model';
import { AwsCluster } from './models/providerModels/AwsCluster.model';
import { AwsNetwork } from './models/providerModels/AwsNetwork.model';
import { EksConfigModel } from './provisionEKS/eksConfigModel';
import {
  createProvisionRequest,
  generateProvisionConfig,
} from './provisionEKS/do_provision';
import { download_from_S3, shell_executor } from 'src/util/shell_methods';
import { parseTerraformOutputFile } from 'src/util/read_shell_output';
import { TerraformResources } from 'src/interfaces/TerraformResources';
import { ClientService } from '../client/client.service';
import { StatusBody } from 'src/client/models/StatusBody';
import { addJob, updateJob } from '../database/db-functions';
import { join } from 'path';

/**
 * Service for handling job provisioning
 * This class defines logic for all /provision endpoints
 */
@Injectable()
export class ProvisionService {
  constructor(private readonly clientService: ClientService) {}
  private readonly logger = new Logger(ProvisionService.name);

  type = 'PROVISION';

  /**
   * Provisions a job for a project
   * @param projectId The ID of the project to provision the job for
   * @param jobId The ID of the job to provision
   * @param provisionRequest The details of the provision request
   */
  async provisionJob(
    projectId: string,
    jobId: string,
    provisionRequest: ProvisionRequest,
  ): Promise<ProvisionResponse> {
    this.logger.log('\nNew provision job:');
    this.logger.debug(`ProjectId: ${projectId} | JobId: ${jobId}`);

    // get credentials from controller
    let credentials: AwsCredentials;
    try {
      credentials = await this.clientService.getCredentials(projectId, jobId);
    } catch (err) {
      this.logger.error(err.message);
      return;
    }

    provisionRequest.credentials = credentials;
    provisionRequest.cluster = new AwsCluster(provisionRequest.cluster);
    provisionRequest.network = new AwsNetwork(provisionRequest.network);

    this.logger.debug(JSON.stringify(provisionRequest, null, 2));

    this.provision(
      projectId,
      jobId,
      provisionRequest,
      this.clientService.sendProvisionStatus,
    );

    // to return ErrorResponse
    // throw new ErrorResponse(ErrorCodes.JOBNOTFOUND, 'Job not found');

    // to return SuccessResponse
    const response = new ProvisionResponse();
    response.status = ResponseStatus.ACCEPTED;
    response.message = 'Provision accepted successfully';
    return response;
  }

  /**
   * Provisions a job for a project
   * @param projectId The ID of the project to provision the job for
   * @param jobId The ID of the job to provision
   * @param provisionRequest The details of the provision request
   */
  async provisionJobV2(
    projectId: string,
    jobId: string,
    provisionRequest: ProvisionRequestV2,
  ): Promise<boolean> {
    this.logger.log('\nNew provision job:');
    this.logger.debug(`ProjectId: ${projectId} | JobId: ${jobId}`);
    this.logger.debug(JSON.stringify(provisionRequest, null, 2));
    // Save stuff to DB
    try {
      await addJob(
        projectId,
        jobId,
        ResponseStatus.INPROGRESS,
        `diana-tests3-bucket/${projectId}/${jobId}`,
        '',
      );
    } catch (err) {
      this.logger.error('Unable to create a new job');
      const resources: TerraformResources = {
        success: false,
        resourcesAdded: 0,
        resourcesChanged: 0,
        resourcesDestroyed: 0,
        ebsVolumeID: '',
        ebsVolumeAvailabilityZone: '',
      };
      this.clientService.sendProvisionStatus(
        this.convertToStatusBody(resources),
      );
      return false;
    }

    const statusBody: StatusBody = {
      service_type: process.env.SERVICE_NAME,
      operation_type: 'PROVISION',
      job_id: jobId,
      project_id: projectId,
      status: '',
      message: '',
    };

    let dirPath: string;
    const provisionFile: string = provisionRequest.provisioningFiles[0];

    //Fetch from S3
    try {
      dirPath = await download_from_S3(
        process.env.S3_ACCESS_ID,
        process.env.SECRET_KEY,
        process.env.TOKEN,
        projectId,
        jobId,
        process.env.S3_BUCKET,
        provisionRequest.provisioningFiles,
      );
    } catch (err) {
      this.logger.error(err.message);
      this.clientService.sendStatus(
        this.type,
        jobId,
        projectId,
        ResponseStatus.FAILED,
        err.message,
      );
      return false;
    }

    // get credentials from controller
    let credentials: AwsCredentials;
    try {
      credentials = await this.clientService.getCredentials(projectId, jobId);
    } catch (err) {
      this.logger.error(err.message);
      statusBody.status = ResponseStatus.FAILED;
      statusBody.message = err.message;
      await updateJob(projectId, jobId, ResponseStatus.FAILED, '', '');
      this.clientService.sendProvisionStatus(statusBody);
      return false;
    }

    // provision the job
    let response: Promise<boolean>;
    try {
      this.logger.debug(`Dirpath: ${dirPath}, file: ${provisionFile}`);
      const filePath = join(dirPath, provisionFile);
      const provisionRequest: ProvisionRequest =
        createProvisionRequest(filePath);
      provisionRequest.credentials = {
        accessKey: credentials.accessKey,
        password: credentials.password,
        token: credentials.token,
      };
      response = this.provision(
        projectId,
        jobId,
        provisionRequest,
        this.clientService.sendProvisionStatus,
      );
    } catch (err) {
      this.logger.error(err.message);
      this.clientService.sendStatus(
        this.type,
        jobId,
        projectId,
        ResponseStatus.FAILED,
        err.message,
      );
      return false;
    }
    return response;
  }

  async provision(
    projectId: string,
    jobId: string,
    provisionRequest: ProvisionRequest,
    updateController: (status: StatusBody) => void,
  ): Promise<boolean> {
    const eksModel = this.convertRequestToEksModel(provisionRequest);
    this.logger.debug(JSON.stringify(eksModel, null, 2));
    this.logger.log('Convert request to eks model done');
    let resources: TerraformResources = {
      success: false,
      resourcesAdded: 0,
      resourcesChanged: 0,
      resourcesDestroyed: 0,
      ebsVolumeID: '',
      ebsVolumeAvailabilityZone: '',
    };
    try {
      generateProvisionConfig(eksModel);
      this.logger.log('Generate provision_config.json done');
      const outputFileName = await shell_executor(1, projectId, jobId, null);
      this.logger.log('Shell executor done ');
      resources = await parseTerraformOutputFile(outputFileName);
      this.logger.log(`Provision success status: ${resources.success}`);
      await updateJob(
        projectId,
        jobId,
        resources.success ? ResponseStatus.SUCCESS : ResponseStatus.FAILED,
        `${process.env.S3_BUCKET}/${projectId}/${jobId}`,
        resources.ebsVolumeID,
      );
    } catch (error) {
      this.logger.error(`Error generating provision config: ${error}`);
      resources.success = false;
      await updateJob(
        projectId,
        jobId,
        resources.success ? ResponseStatus.SUCCESS : ResponseStatus.FAILED,
        `${process.env.S3_BUCKET}/${projectId}/${jobId}`,
        resources.ebsVolumeID,
      );
      const statusBody = this.convertToStatusBody(resources);
      statusBody.job_id = jobId;
      statusBody.project_id = projectId;
      updateController(statusBody);
      return resources.success;
    }

    const statusBody = this.convertToStatusBody(resources);
    statusBody.job_id = jobId;
    statusBody.project_id = projectId;
    updateController(statusBody);
    return resources.success;
  }

  convertRequestToEksModel(request: ProvisionRequest): EksConfigModel {
    return {
      accessKey: request.credentials.accessKey,
      secretKey: request.credentials.password,
      token: request.credentials.token,
      region: request.region,
      vpcName: request.network.name,
      cidr: request.network.cidr,
      azs: request.network.availabilityZones,
      privateSubnets: request.network.privateSubnets,
      publicSubnets: request.network.publicSubnets,
      clusterName: request.cluster.name,
      desiredSize: request.cluster.desiredSize,
    };
  }

  convertToStatusBody(resources: TerraformResources): StatusBody {
    const statusBody: StatusBody = {
      service_type: process.env.SERVICE_NAME,
      operation_type: this.type,
      job_id: '',
      project_id: '',
      status: '',
      message: '',
    };
    statusBody.service_type = process.env.SERVICE_NAME;
    statusBody.operation_type = 'PROVISION';
    if (resources.success) {
      statusBody.status = ResponseStatus.SUCCESS;
      statusBody.message = JSON.stringify(resources);
    } else {
      statusBody.status = ResponseStatus.FAILED;
      statusBody.message = 'Provisioning failed';
    }
    return statusBody;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Request } from './models/request.model';
import { DeploymentService } from 'src/deployment/deployment.service';
import { ProvisionService } from 'src/provision/provision.service';
import { ProvisionRequestV2 } from 'src/provision/models/request.model';
import { DeploymentRequestV2 } from 'src/deployment/models/request.model';

@Injectable()
export class ProvisionDeploymentService {
  constructor(
    private readonly provisionService: ProvisionService,
    private readonly deploymentService: DeploymentService,
  ) {}
  private readonly logger = new Logger(ProvisionDeploymentService.name);

  /**
   * Method to provision and deploy a new Job
   * @param projectId - The ID of the project the job belongs to
   * @param jobId - The ID of the job to provision and deploy
   * @param request - Request object containing details for the request
   */
  async newJob(projectId: string, jobId: string, request: Request) {
    console.log('\nNew combine job:');
    console.log(`ProjectId: ${projectId} | JobId: ${jobId}`);
    console.log(JSON.stringify(request, null, 2));

    this.initiate(projectId, jobId, request);
  }

  /**
   * Method to initiate process of provisioning and deploying
   * @param projectId - The ID of the project of the job to provision
   * @param jobId - The ID of the job to provision
   * @param request - Request object containing details for the request
   */
  async initiate(projectId: string, jobId: string, request: Request) {
    // provisioning the job
    let provisionStatus = false;
    if (request.provision) {
      this.logger.log('Initiating provisioning');
      provisionStatus = await this.doProvision(projectId, jobId, request);
    }
    this.logger.debug(`Provision status: ${provisionStatus}`);

    // deploying the job
    let deploymentStatus = false;
    if (request.deploy && provisionStatus) {
      this.logger.log('Initiating deployment');
      deploymentStatus = await this.doDeployment(projectId, jobId, request);
    }
    this.logger.debug(`Deployment status: ${deploymentStatus}`);

    this.logger.log(
      `Final status: Provision - ${provisionStatus} | Deployment - ${deploymentStatus}`,
    );
  }

  /**
   * Method to provision a new Job
   * @param projectId - The ID of the project of the job to provision
   * @param jobId - The ID of the job to provision
   * @param request - Request object containing details for the request
   * @returns boolean
   */
  async doProvision(
    projectId: string,
    jobId: string,
    request: Request,
  ): Promise<boolean> {
    // create provisionRequest
    const provisionRequest: ProvisionRequestV2 = {
      provisioningFiles: request.provisioningFiles,
    };
    // call provision service
    return await this.provisionService.provisionJobV2(
      projectId,
      jobId,
      provisionRequest,
    );
  }

  /**
   * Method to deploy a new Job
   * @param projectId - The ID of the project of the job to deploy
   * @param jobId - The ID of the job to deploy
   * @param request - Request object containing details for the request
   * @returns boolean
   */
  async doDeployment(
    projectId: string,
    jobId: string,
    request: Request,
  ): Promise<boolean> {
    // create deployment request
    const deploymentRequest: DeploymentRequestV2 = {
      deployingFiles: request.deployingFiles,
    };
    // call deployment service
    return await this.deploymentService.deployJobV2(
      projectId,
      jobId,
      deploymentRequest,
    );
  }
}

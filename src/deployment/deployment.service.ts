import { Injectable, Logger } from '@nestjs/common';
import { deploy, download_from_S3 } from 'src/util/shell_methods';
import { DeploymentRequestV2 } from './models/request.model';
import { ClientService } from 'src/client/client.service';
import { updateJob } from 'src/database/db-functions';
import { ResponseStatus } from 'src/provision/models/response.model';
import { Credentials } from 'src/interfaces/Credentials';
import { AwsCredentials } from 'src/provision/models/providerModels/AwsCredentials.model';
import { readFileContents } from 'src/util/shell_methods';
import { join } from 'path';
import { pre_processing_yaml } from 'src/util/pre_processing_yaml';

@Injectable()
export class DeploymentService {
  constructor(private readonly clientService: ClientService) {}
  private readonly logger = new Logger(DeploymentService.name);

  type = 'DEPLOYMENT';

  async deployJob(projectId: string, jobId: string) {
    console.log('\nNew deployment job:');
    console.log(`ProjectId: ${projectId} | JobId: ${jobId}`);
    this.deployment(projectId, jobId);
  }

  async deployJobV2(
    projectId: string,
    jobId: string,
    deploymentRequest: DeploymentRequestV2,
  ): Promise<boolean> {
    this.logger.log('\nNew deployment job:');
    this.logger.log(`ProjectId: ${projectId} | JobId: ${jobId}`);
    this.logger.log(JSON.stringify(deploymentRequest, null, 2));

    // get credentials from controller
    let credentials: AwsCredentials;
    try {
      credentials = await this.clientService.getCredentials(projectId, jobId);
    } catch (err) {
      this.logger.error(err.message);
      this.clientService.sendStatus(
        this.type,
        projectId,
        jobId,
        ResponseStatus.FAILED,
        err.message,
      );
      return false;
    }
    const region = 'us-east-2';
    const clusterName = 'my-eks';
    // const dir = `~/${projectId}/${jobId}`;

    //Fetch from S3
    let dirPath: string;
    try {
      dirPath = await download_from_S3(
        process.env.S3_ACCESS_ID,
        process.env.SECRET_KEY,
        process.env.TOKEN,
        projectId,
        jobId,
        process.env.S3_BUCKET,
        deploymentRequest.deployingFiles,
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

    // convert the path to absolute path
    // const dir = join(homedir(), `/${projectId}/${jobId}`);
    console.log(dirPath);
    try {
      await pre_processing_yaml(dirPath);
      this.logger.log('preprocessing yaml successfully');
    } catch (err) {
      this.logger.error(err.message);
      this.clientService.sendStatus(
        this.type,
        projectId,
        jobId,
        ResponseStatus.FAILED,
        err.message,
      );
      return false;
    }

    this.logger.log('Initiating deploy');
    const filePath = await deploy(
      credentials.accessKey,
      credentials.password,
      credentials.token,
      region,
      clusterName,
      projectId,
      jobId,
      dirPath,
    );
    this.logger.debug(`filePath: ${filePath}`);
    // TODO: read file filePath
    const message = await readFileContents(filePath);
    this.logger.log(`message: ${message}`);
    this.clientService.sendStatus(
      this.type,
      jobId,
      projectId,
      ResponseStatus.SUCCESS,
      message,
    );
    return true;
  }

  async deployment(projectId: string, jobId: string) {
    await deploy(
      'ASIARSTZDNBIYEL5DTAJ',
      '2YN5SLwwyGkfTvFyhgUsMyg/NeH/HwBrPqXMOz0g',
      'FwoGZXIvYXdzEMv//////////wEaDCWzq1bDXfOqAnYDbCK4AdmNDHhnDBLkVfPjLPf41dRVvQIdb8HEB6VSemwQqXOBSxw8A8XlncN0UFr4e/LxHK8xafu8IMWjoM5mhKH9DY0Zc1StE3Pq+sxXG2eMTaDigfkirlyr8LYCwViuS1xfry5frHfTsWGAV+AD2FinDAT/wLIuR6M05ktfNS5VTmstD/dh4rjMRliwVVFSshnGD5tTkzIs0861WBALO0c4qIJt8be7LOMOhjEpN+ewCSyku4c1r4E4PFMoqpLFogYyLRoYvcRi1iY4kmOOJwXg2kMBaD0moX85ycuo3kU+LV9pZPwG+/E6onKe55G9VQ==',
      'us-east-1',
      'test',
      projectId,
      jobId,
      './data/demo/',
    );
  }
}

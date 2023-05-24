import * as util from 'util';
import * as fs from 'fs';
import * as constants from 'constants';
import * as child_process from 'child_process';
import { join, dirname } from 'path';
import { Logger } from '@nestjs/common';
import { homedir } from 'os';
import { parseK8sService } from './read_shell_output';
import { K8sService } from 'src/interfaces/K8sService';

const logger = new Logger('shellMethods');

const DATA_DIR = 'data';
const OUTPUT_DIR = join(DATA_DIR, 'output');

/**
 * Creates the command required to run CDKTF deploy command
 * @param outputfilename is the file to store the output
 * returns the commands in a string array
 */
export function generate_provision_commands(outputfilename: string): string[] {
  const provision_commands: string[] = [
    `cdktf deploy --auto-approve > ${outputfilename}`,
  ];

  return provision_commands;
}

/**
 * Creates the base command required to download files from S3
 * @param aws_access_key_id
 * @param aws_secret_access_key
 * @param aws_session_token are the credentials required to access our own S3 bucket
 * returns the commands in a string array
 * s3 cp commands will be injected from a different function
 */
export function generate_s3_cp_command_base(
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_session_token: string,
): string[] {
  const commands: string[] = [
    `export AWS_ACCESS_KEY_ID=${aws_access_key_id} && export AWS_SECRET_ACCESS_KEY=${aws_secret_access_key} && export AWS_SESSION_TOKEN=${aws_session_token}`,
  ];

  return commands;
}

/**
 * Creates the command to update and rename/save kubeconfig files
 * @param aws_access_key_id
 * @param aws_secret_access_key
 * @param aws_session_token are the user's aws credentials
 * @param user_region is the region of the user's cluster
 * @param cluster_name is the name of the user's cluster
 */
export function generate_aws_kubeconfig_commands(
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_session_token: string,
  user_region: string,
  cluster_name: string,
): string[] {
  const commands: string[] = [
    `export AWS_ACCESS_KEY_ID=${aws_access_key_id} && export AWS_SECRET_ACCESS_KEY=${aws_secret_access_key} && export AWS_SESSION_TOKEN=${aws_session_token}`,
    `aws eks update-kubeconfig --region ${user_region} --name ${cluster_name}`,
    `mv ~/.kube/config ~/.kube/config_${cluster_name}`,
  ];

  return commands;
}

/**
 * Creates the command to run our shell command that deploys to the user's k8s
 * @param deployment_yaml_dir_path is the directory the yaml files are located
 * @param kube_config_path is the path to the user's k8s yaml files directory
 * @param output_filename is the result of the output
 */
export function generate_deployment_commands(
  deployment_yaml_dir_path: string,
  kube_config_path: string,
  output_filename: string,
): string[] {
  const deployment_commands: string[] = [
    `./src/scripts/kubectl_apply.sh ${deployment_yaml_dir_path} ${kube_config_path} > ${output_filename}`,
  ];

  return deployment_commands;
}

/**
 * Creates the directory if not exist
 * @param directoryPath is the directory path
 */
export async function createDirectory(directoryPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.debug(`Creating dir: ${directoryPath}`);
    fs.mkdir(directoryPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
        logger.debug(`Created: ${directoryPath}`);
      }
    });
  });
}

/**
 * Writes a string array to a file
 * @param commands is the commands string array
 * @param filePath is the path of the file
 */
export async function write_to_file(
  commands: string[],
  filePath: string,
): Promise<void> {
  logger.debug(`filePath: ${filePath}`);
  const dir = dirname(filePath);
  await createDirectory(dir);
  const fileContents = commands.join('\n') + '\n';
  await fs.promises.writeFile(filePath, fileContents);
  logger.debug(`File written: ${filePath}`);
}

/**
 * Appends a string array to a file
 * @param commands is the commands string array
 * @param filePath is the path of the file
 */
export async function append_to_file(
  commands: K8sService[],
  filePath: string,
): Promise<void> {
  logger.debug(`Appending filePath: ${filePath}`);
  const fileContents = JSON.stringify(commands, null, 2);
  await fs.promises.appendFile(filePath, fileContents);
  logger.debug(`File written: ${filePath}`);
}

/**
 * Read the contents of a file
 * @param filePath is the path to the file
 */
export async function readFileContents(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/*
  The following functions require an asynchronous exec
 */

const exec = util.promisify(require('child_process').exec);

/**
 * Executes the provision command
 * @param option
 * @param projectid is the id of the project
 * @param jobid is the id of the job
 * @param tags
 * return the name of the file storing the output
 */
export async function shell_executor(
  option: number,
  projectid: string,
  jobid: string,
  tags: { [key: string]: string },
): Promise<string> {
  await createDirectory(OUTPUT_DIR);
  const outputfilename = join(OUTPUT_DIR, `${projectid}_${jobid}.txt`);

  if (option === 1) {
    //provision
    const command_filename = join(
      DATA_DIR,
      `${projectid}/${jobid}/provision.sh`,
    );
    await write_to_file(
      generate_provision_commands(outputfilename),
      command_filename,
    );
    await exec(`chmod +x ${command_filename}`);
    await exec(`./${command_filename}`);
  }

  return outputfilename;
}

/**
 * Check if the user's EKS correctly connected to kubectl
 */
export async function check_k8s_status(): Promise<boolean> {
  try {
    fs.accessSync('./src/scripts/check_k8s_status.sh', constants.X_OK);
  } catch (err) {
    await exec('chmod +x ./src/scripts/check_k8s_status.sh');
  }
  try {
    const output = await exec('./src/scripts/check_k8s_status.sh', {
      encoding: 'utf-8',
    });
    return output.stdout.trim('\n') === 'Kubernetes is connected';
  } catch (err) {
    return false;
  }
}

/**
 * Deploy the user's yaml files
 * @param aws_access_key_id
 * @param aws_secret_access_key
 * @param aws_session_token are the user's credentials
 * @param projectid is the id of the project
 * @param jobid is the id of the job
 * @param deployment_yaml_dir_path is the path to the user's k8s yaml file directory
 * @param kube_config_path is the path to the user's kubeconfig file
 */
export async function do_deploy(
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_session_token: string,
  projectid: string,
  jobid: string,
  deployment_yaml_dir_path: string,
  kube_config_path: string,
): Promise<string> {
  await exec(`chmod +x ./src/scripts/kubectl_apply.sh`);
  await createDirectory(OUTPUT_DIR);
  const deployment_output_filename = join(
    OUTPUT_DIR,
    `${projectid}/${jobid}/deployment.txt`,
  );
  createDirectory(dirname(deployment_output_filename));
  const getServiceCmd = `kubectl --kubeconfig="${kube_config_path}" get service`;
  const serviceOutput = join(
    OUTPUT_DIR,
    `${projectid}/${jobid}/serviceOutput.txt`,
  );
  await exec(
    `export AWS_ACCESS_KEY_ID=${aws_access_key_id} && export AWS_SECRET_ACCESS_KEY=${aws_secret_access_key} && export AWS_SESSION_TOKEN=${aws_session_token} && ./${generate_deployment_commands(
      deployment_yaml_dir_path,
      kube_config_path,
      deployment_output_filename,
    )} && ${getServiceCmd} > ${serviceOutput}`,
  );

  const loadBalancers = await parseK8sService(serviceOutput);
  await append_to_file(loadBalancers, deployment_output_filename);
  return deployment_output_filename;
}

/**
 *
 * @param aws_access_key_id
 * @param aws_secret_access_key
 * @param aws_session_token is our aws credentials to access S3 bucket
 * @param projectid is the id of the project
 * @param jobid is the id of the job
 * @param bucket_name is the name of the bucket
 * @param file_list is an array of strings storing all files required to be fetched
 */
export async function download_from_S3(
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_session_token: string,
  projectid: string,
  jobid: string,
  bucket_name: string,
  file_list: string[],
): Promise<string> {
  try {
    logger.log('Downloading from S3');
    const s3_cp_command = generate_s3_cp_command_base(
      aws_access_key_id,
      aws_secret_access_key,
      aws_session_token,
    );
    const dir_path = join(homedir(), `/${projectid}/${jobid}`);
    logger.debug(`Dir_path: ${dir_path}`);
    s3_cp_command.push(`mkdir -p ${dir_path}`);
    logger.debug(`file_list: ${file_list}`);
    for (const file of file_list) {
      s3_cp_command.push(
        `aws s3 cp s3://${bucket_name}/${projectid}/${jobid}/${file} ${dir_path}`,
      );
    }

    const command_filename = join(DATA_DIR, `fetch_${projectid}_${jobid}.sh`);
    logger.debug(`command_filename: ${command_filename}`);

    await write_to_file(s3_cp_command, command_filename);

    await exec(`chmod +x ${command_filename}`);
    logger.debug(`chmod +x ${command_filename}`);

    await exec(`./${command_filename}`);
    logger.debug(`./${command_filename}`);

    await exec(`rm ${command_filename}`);
    logger.debug(`rm ${command_filename}`);

    return dir_path;
  } catch (err) {
    console.log(`Error downloading file from S3: ${err.message}`);
    throw new Error('Unable to download from S3');
  }
}

/**
 * Wrapped function to run all commands to deploy
 * @param aws_access_key_id
 * @param aws_secret_access_key
 * @param aws_session_token are the user's aws credentials
 * @param user_region is the region where the user's cluster is located
 * @param cluster_name is the name of the user's cluster
 * @param projectid is the id of the project
 * @param jobid is the id of the job
 * @param deployment_yaml_dir_path is the directory of the user's k8s yaml
 */
export async function deploy(
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_session_token: string,
  user_region: string,
  cluster_name: string,
  projectid: string,
  jobid: string,
  deployment_yaml_dir_path: string,
): Promise<string> {
  const kubeconfig_commands = generate_aws_kubeconfig_commands(
    aws_access_key_id,
    aws_secret_access_key,
    aws_session_token,
    user_region,
    cluster_name,
  );
  const command_filename = join(DATA_DIR, `/${projectid}/${jobid}/deploy.sh`);
  logger.debug(`command_filename: ${command_filename}`);

  await write_to_file(kubeconfig_commands, command_filename);

  await exec(`chmod +x ${command_filename}`);
  logger.debug(`chmod +x ${command_filename}`);

  await exec(`./${command_filename} `);
  logger.debug(`./${command_filename}`);

  await exec(`rm ${command_filename}`);
  logger.debug(`rm ${command_filename}`);

  const kube_config_path = await exec(`ls ~/.kube/config_${cluster_name}`, {
    encoding: 'utf-8',
  });
  logger.debug(`kube_config_path: ${kube_config_path}`);

  const result_filename = await do_deploy(
    aws_access_key_id,
    aws_secret_access_key,
    aws_session_token,
    projectid,
    jobid,
    deployment_yaml_dir_path,
    kube_config_path.stdout.trim('\n'),
  );
  return result_filename;
}

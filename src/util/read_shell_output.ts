import { readFile } from 'fs/promises';
import { TerraformResources } from '../interfaces/TerraformResources';
import { K8sService } from '../interfaces/K8sService';

/**
 * Parse the output of the "terraform apply" (CDTKF deploy)
 * @param filePath is the absolute file path to the terraform output file
 * return a TerraformResources object indicating the success or failure of the
 * process with the resources added, changed, destroyed.
 */
export async function parseTerraformOutputFile(
  filePath: string,
): Promise<TerraformResources> {
  const fileContents = await readFile(filePath, { encoding: 'utf-8' });
  const regex =
    /Apply complete! Resources: (\d+) added, (\d+) changed, (\d+) destroyed./;
  const match = fileContents.match(regex);
  if (!match) {
    return {
      success: false,
      resourcesAdded: 0,
      resourcesChanged: 0,
      resourcesDestroyed: 0,
      ebsVolumeAvailabilityZone: '',
      ebsVolumeID: '',
    };
  }
  return {
    success: true,
    resourcesAdded: Number(match[1]),
    resourcesChanged: Number(match[2]),
    resourcesDestroyed: Number(match[3]),
    ebsVolumeAvailabilityZone: '',
    ebsVolumeID: '',
  };
}

/**
 * Parse the output of kubectl apply
 * @param filePath is the absolute path for the output file
 * returns an array of K8sService object, which includes the name of the
 * service and the external-ip that are publicly exposed
 */
export async function parseK8sService(filePath: string): Promise<K8sService[]> {
  const services: K8sService[] = [];
  const fileContents = await readFile(filePath, { encoding: 'utf-8' });

  const lines = fileContents.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].trim().split(/\s+/);
    const name = fields[0];
    const type = fields[1];
    const externalIP = fields[3];
    let port = '';
    if (fields[4]) {
      port = fields[4].split(':')[0];
    }

    if (type !== 'LoadBalancer' || externalIP === '<none>') {
      continue;
    }
    if (port === '80' || port === '') {
      services.push({ name: name, externalIP: `${externalIP}` });
    } else {
      services.push({ name: name, externalIP: `${externalIP}:${port}` });
    }
  }

  return services;
}

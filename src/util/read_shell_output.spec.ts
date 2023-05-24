import { parseK8sService, parseTerraformOutputFile } from './read_shell_output';
import { TerraformResources } from '../interfaces/TerraformResources';

describe('parseTerraformOutputFile', () => {
  const filePath = 'src/util/test/terraform_output.txt';

  it('should parse file contents and return TerraformResources', async () => {
    const expected: TerraformResources = {
      success: true,
      resourcesAdded: 49,
      resourcesChanged: 0,
      resourcesDestroyed: 0,
      ebsVolumeAvailabilityZone: '',
      ebsVolumeID: '',
    };

    const result = await parseTerraformOutputFile(filePath);

    expect(result).toEqual(expected);
  });

  it('should return default TerraformResources if file contents do not match regex', async () => {
    const filePath = 'src/util/test/bad_output.txt';
    const expected: TerraformResources = {
      success: false,
      resourcesAdded: 0,
      resourcesChanged: 0,
      resourcesDestroyed: 0,
      ebsVolumeAvailabilityZone: '',
      ebsVolumeID: '',
    };

    const result = await parseTerraformOutputFile(filePath);

    expect(result).toEqual(expected);
  });
});

describe('parseK8sService', () => {
  it('should return an empty array when given an empty file', async () => {
    const services = await parseK8sService('src/util/test/empty_k8s.txt');
    expect(services).toEqual([]);
  });

  it('should return an array of services with external IPs', async () => {
    const services = await parseK8sService('src/util/test/normal_k8s.txt');
    expect(services).toEqual([
      {
        name: 'frontend-tcp',
        externalIP: '1.2.3.4',
      },
    ]);
  });

  it('should return an array of services with external IPs with port', async () => {
    const services = await parseK8sService('src/util/test/extra_k8s.txt');
    expect(services).toEqual([
      {
        name: 'scrum-ui-tcp',
        externalIP:
          'a218dd7151eae4f3080f6a14f4c2c530-677186731.us-east-2.elb.amazonaws.com:4200',
      },
      {
        name: 'scrum-ui2-tcp',
        externalIP:
          'adee6de8b02604ae0b9743449151178d-252527843.us-east-2.elb.amazonaws.com:4201',
      },
    ]);
  });
});

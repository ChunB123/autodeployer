export class EksConfigModel {
  accessKey: string;
  secretKey: string;
  token: string;
  region: string;
  vpcName: string;
  cidr: string;
  azs: string[];
  privateSubnets: string[];
  publicSubnets: string[];
  clusterName: string;
  desiredSize: number;
}

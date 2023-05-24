// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Network {
  name: string;
  cidr: string;
  availabilityZones: string[];
  privateSubnets: string[];
  publicSubnets: string[];
}

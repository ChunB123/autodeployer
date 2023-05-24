import { writeFileSync,readFileSync } from "fs";
import { EksConfigModel } from "./eksConfigModel";
import { ProvisionRequest } from "../models/request.model";

export const generateProvisionConfig = (variables: EksConfigModel): void => {
  try {
    writeFileSync("./data/provision_config.json", JSON.stringify(variables));
  } catch (error) {
    throw new Error(`Error writing file: ${error}`);
  }
};

export function createProvisionRequest(filePath: string): ProvisionRequest {
  try{
    const parsedData = JSON.parse(readFileSync(filePath, 'utf8'));
    return {
      credentials: { accessKey: '', password: '', token: '' },
      region: parsedData.region,
      network: {
        name: parsedData.network.name,
        cidr: parsedData.network.cidr,
        availabilityZones: parsedData.network.availabilityZones,
        privateSubnets: parsedData.network.privateSubnets,
        publicSubnets: parsedData.network.publicSubnets,
      },
      cluster: {
        name: parsedData.cluster.name,
        desiredSize: parsedData.cluster.desiredSize,
      },
    };
  }catch (error){
    console.log('Failed to read provision.json')
    throw new Error(`Failed to read provision.json: ${error.message}`)
  }
}

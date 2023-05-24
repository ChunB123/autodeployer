import { createProvisionRequest, generateProvisionConfig } from "./do_provision";
import { EksConfigModel } from "./eksConfigModel";
import { readFileSync } from "fs";
import * as path from 'path';
import { ProvisionRequest } from "../models/request.model";
describe("generateProvisionConfig", () => {
  it("should write the EksConfigModel to a JSON file", () => {
    const myConfig: EksConfigModel = {
      accessKey: "",
      secretKey: "",
      token: "",
      region: "us-east-2",
      vpcName: "my-vpc",
      cidr: "10.0.0.0/16",
      azs: ["us-east-2a", "us-east-2b", "us-east-2c"],
      privateSubnets: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
      publicSubnets: ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"],
      clusterName: "my-eks",
      desiredSize: 2
    };

    generateProvisionConfig(myConfig);

    const jsonData = readFileSync("./data/provision_config.json", "utf8");
    const savedConfig = JSON.parse(jsonData);

    expect(savedConfig).toEqual(myConfig);
  });
});

describe('createProvisionRequest', () => {
  const testFilePath = path.join(__dirname, 'test/provision.json');;

  test('parses JSON file and returns ProvisionRequest instance', () => {
    const expected: ProvisionRequest = {
      credentials: {
        accessKey: '',
        password: '',
        token: '',
      },
      region: 'us-east-2',
      network: {
        name: 'my-vpc',
        cidr: '10.0.0.0/16',
        availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        privateSubnets: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        publicSubnets: ['10.0.4.0/24', '10.0.5.0/24', '10.0.6.0/24'],
      },
      cluster: {
        name: 'my-eks',
        desiredSize: 3,
      },
    };
    const result = createProvisionRequest(testFilePath);
    expect(result).toEqual(expected);
  });
});

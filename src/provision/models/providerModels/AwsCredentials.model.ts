import { Credentials } from 'src/interfaces/Credentials';

export class AwsCredentials implements Credentials {
  accessKey: string;
  password: string;
  token?: string;

  constructor(credentials: Credentials) {
    this.accessKey = credentials.accessKey;
    this.password = credentials.password;
    this.token = credentials.token;
  }
}

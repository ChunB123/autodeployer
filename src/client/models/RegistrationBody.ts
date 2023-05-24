export enum RequestType {
  GET = 'GET',
  POST = 'POST',
}

export interface Service {
  service_name: string;
  request_type: RequestType;
  service_uri: string;
}

export interface RegistrationBody {
  service_type: string;
  host_name: string;
  services: Service[];
}

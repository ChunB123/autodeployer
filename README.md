
## Description

AwsOps microservice for autodeployer

## API documentation

https://sdlc-autodeployer-s23.github.io/autodeployer-awsops/

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Running container
```
docker build -t autodeployer-awsops .
docker run --name silly_wing -it -p 3000:3000 \
--volume ${PWD}/data:/app/data \
--volume ${PWD}/src:/app/src \
autodeployer-awsops
```

## Mounting current directory when running container (helpful for development process)
```
docker run -it --volume ${PWD}:/app autodeployer-awsops
```

## useful docker commands
- to detach: ctrl+p ctrl+q
- list images: docker images
- list containers: docker ps
- attach to a container: docker attach CONTAINER_NAME
- to read the data switch to the data directory and run:
```
 tail -f output_456.txt
```

## CDKTF usage
- generate .gen
```
cdktf get
```
- Set up the credentials in the ts file
- OR set up the env variables if no credentials in ts file
```
export AWS_ACCESS_KEY_ID="" &&
export AWS_SECRET_ACCESS_KEY=""
```
- Substitute the config file in cdktf.json ("app": "npx ts-node ./src/services/eks.ts")
- Check the result of cdktf deploy
```
cdktf deploy
cdktf destroy
```


## Development Notes

https://github.com/sdlc-autodeployer-s23/autodeployer-awsops/wiki/Development-Notes

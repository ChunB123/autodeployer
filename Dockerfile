# Start with the latest Ubuntu image
FROM --platform=linux/amd64 ubuntu:latest

# Install required packages
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y unzip && \
    apt-get install -y git && \
    apt-get install -y build-essential && \
    apt-get install -y jq

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# install mysql
RUN apt-get install -y mysql-server

# Upgrade npm to the latest version
RUN npm install -g npm@latest

# Install Terraform
RUN curl -LO https://releases.hashicorp.com/terraform/1.3.0/terraform_1.3.0_linux_amd64.zip && \
    unzip terraform_1.3.0_linux_amd64.zip && \
    mv terraform /usr/local/bin && \
    rm terraform_1.3.0_linux_amd64.zip

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm awscliv2.zip

# Install kubectl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.23.0/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

# Install CDK for Terraform
RUN npm install -g cdktf-cli@0.15.0

# Install Typescript
RUN npm install -g typescript

# Set working directory
WORKDIR /app

# Copy source code
COPY . /app

# Install dependencies
RUN npm install

# Get cdktf Libraries
RUN cdktf get

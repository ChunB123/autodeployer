#!/bin/bash
#Check if kubernetes is connected by checking kubectl cluster-info
if kubectl cluster-info &> /dev/null; then
  echo "Kubernetes is connected"
else
  echo "Unable to connect to Kubernetes"
fi
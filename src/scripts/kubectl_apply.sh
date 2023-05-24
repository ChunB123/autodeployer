#!/bin/bash
#For every yaml file in the directory, apply the file with given kubeconfig file
for file in "$1"/*.yaml; do
  kubectl --kubeconfig="$2" apply -f "$file"
done

#!/bin/bash

set -e

echo PWD: $PWD

if [ -z "$SSH_KEY" ]; then
  echo "Error: The SSH_KEY environment variable is not set."
  exit 1
fi

if [ -z "$SRC" ]; then
  echo "Error: The SRC environment variable is not set."
  exit 1
fi

if [ -z "$DIST" ]; then
  echo "Error: The DIST environment variable is not set."
  exit 1
fi

npm run build

rsync -e "ssh -i $SSH_KEY" -avz $SRC $DIST



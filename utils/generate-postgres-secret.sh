#!/bin/bash

# Script to generate and update Kubernetes PostgreSQL secret

set -e

SECRET_FILE="k8s/postgres-secret.yaml"

# Check if the secret file exists
if [ ! -f "$SECRET_FILE" ]; then
  echo "Error: Secret file $SECRET_FILE not found. Please ensure it exists." >&2
  exit 1
fi

echo "This script will help you generate base64 encoded values for your PostgreSQL secret."
echo "The secret will be updated in: $SECRET_FILE"

# Prompt for PostgreSQL password securely
read -s -p "Enter PostgreSQL password: " PG_PASSWORD
echo

if [ -z "$PG_PASSWORD" ]; then
  echo "Error: Password cannot be empty." >&2
  exit 1
fi

# Define the database URL based on the Kubernetes service name
# This assumes the service is named 'postgres' in the 'petstore' namespace
PG_DB_URL="postgresql://postgres:${PG_PASSWORD}@postgres.petstore.svc.cluster.local:5432/petstore"

# Base64 encode the password and URL
ENCODED_PG_PASSWORD=$(echo -n "$PG_PASSWORD" | base64)
ENCODED_PG_DB_URL=$(echo -n "$PG_DB_URL" | base64)

# Use sed to replace the placeholders in the secret file
# Using a temporary file for portability across different sed versions (macOS vs Linux)

# Replace POSTGRES_PASSWORD
sed -i.bak "s|POSTGRES_PASSWORD: <base64-encoded-password>|POSTGRES_PASSWORD: $ENCODED_PG_PASSWORD|" "$SECRET_FILE"

# Replace DATABASE_URL
sed -i.bak "s|DATABASE_URL: <base64-encoded-connection-string>|DATABASE_URL: $ENCODED_PG_DB_URL|" "$SECRET_FILE"

# Clean up the backup file created by sed
rm "${SECRET_FILE}.bak"

echo "\nPostgreSQL secret updated successfully in $SECRET_FILE"
echo "Remember to keep your password secure and do not commit it to version control."

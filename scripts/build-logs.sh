#!/bin/bash

# Script: build_info.sh
# Description: Collects build information and dumps them into a build_info.txt file.
# Author: Your Name
# Date: $(date +"%Y-%m-%d %H:%M:%S")

# Function to get the latest commit hash
get_latest_commit_hash() {
  git rev-parse HEAD
}

# Function to get the latest commit message
get_latest_commit_message() {
  git log -1 --pretty=%B | sed 's/^/    /'
}

# Function to get the version from package.json
get_package_version() {
  cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | awk '{$1=$1};1' \
    | sed 's/[",]//g'
}

# Function to get Node.js version
get_node_version() {
  node --version
}

# Function to get PNPM version
get_pnpm_version() {
  pnpm --version
}

# Main script

# Output file
output_file="public/next-debug.log"

# Check if package.json exists
if [ -f "package.json" ]; then

  # Get build information
  commit_hash=$(get_latest_commit_hash)
  commit_message=$(get_latest_commit_message)
  version=$(get_package_version)
  node_version=$(get_node_version)
  pnpm_version=$(get_pnpm_version)
  build_time=$(date +"%Y-%m-%d %H:%M:%S")

  # Create or overwrite the output file
  echo "Build Information" > "$output_file"
  echo "-----------------" >> "$output_file"
  echo "Build Time: $build_time" >> "$output_file"
  echo "Node.js Version: $node_version" >> "$output_file"
  echo "PNPM Version: $pnpm_version" >> "$output_file"
  echo "Application Version: v$version" >> "$output_file"
  echo "Latest Commit Hash: $commit_hash" >> "$output_file"
  echo "Latest Commit Message:" >> "$output_file"
  echo "" >> "$output_file"
  echo "$commit_message" >> "$output_file"

else
  echo "Error: package.json not found. Make sure you are in the correct directory."
fi

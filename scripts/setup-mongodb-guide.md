# MongoDB Atlas Setup via CLI

This guide helps you create a MongoDB Atlas project and cluster using the Atlas CLI.

## Prerequisites

1. Install MongoDB Atlas CLI:
   ```bash
   # macOS
   brew install mongodb-atlas-cli
   
   # Or download from: https://www.mongodb.com/try/download/atlascli
   ```

2. Login to Atlas:
   ```bash
   atlas auth login
   ```

## Step-by-Step Setup

### 1. Create Project
```bash
# Create a new project
atlas projects create "ChatGuusPT" --output json

# Get the project ID (save this!)
atlas projects list --output json | jq -r '.results[] | select(.name=="ChatGuusPT").id'
```

### 2. Create Cluster
```bash
# Replace PROJECT_ID with your actual project ID
export PROJECT_ID="your-project-id-here"

# Create a free M0 cluster
atlas clusters create "chatguuspt-cluster" \
  --provider AWS \
  --region US_EAST_1 \
  --tier M0 \
  --projectId $PROJECT_ID

# Wait for cluster to be ready
atlas clusters watch "chatguuspt-cluster" --projectId $PROJECT_ID
```

### 3. Create Database User
```bash
# Create a database user (replace with a strong password!)
atlas dbusers create \
  --username chatguuspt-user \
  --password "CHANGE_THIS_TO_STRONG_PASSWORD" \
  --role readWriteAnyDatabase \
  --projectId $PROJECT_ID
```

### 4. Configure Network Access
```bash
# Allow access from anywhere (needed for Netlify)
# In production, consider restricting to specific IPs
atlas accessLists create \
  --type cidrBlock \
  --cidrBlock "0.0.0.0/0" \
  --comment "Netlify Functions Access" \
  --projectId $PROJECT_ID
```

### 5. Get Connection String
```bash
# Get the connection string
atlas clusters connectionStrings describe "chatguuspt-cluster" \
  --projectId $PROJECT_ID \
  --type standard \
  --output json
```

## Next Steps

1. **Copy the connection string** from the output above
2. **Replace the password** in the connection string with your actual password
3. **Add to Netlify environment variables**:
   ```bash
   netlify env:set MONGODB_URI "your-connection-string-here"
   ```
4. **Test the connection**:
   ```bash
   npm run test:mongodb
   ```
5. **Deploy to production**:
   ```bash
   npm run deploy
   ```

## Security Notes

- Never commit connection strings to Git
- Use strong, unique passwords
- In production, restrict network access to specific IPs
- Rotate passwords regularly
- Monitor database access in Atlas dashboard

## Troubleshooting

If you get authentication errors:
1. Double-check the username and password
2. Ensure the user has the correct permissions
3. Verify network access is configured
4. Check if the cluster is running

For connection timeouts:
1. Verify network access allows 0.0.0.0/0
2. Check if your local firewall blocks MongoDB connections
3. Try connecting from MongoDB Compass to test

## Cleanup (if needed)

To remove everything:
```bash
# Delete cluster (this will delete all data!)
atlas clusters delete "chatguuspt-cluster" --projectId $PROJECT_ID --force

# Delete project
atlas projects delete $PROJECT_ID --force
```

⚠️ **Warning**: Deleting a cluster permanently removes all data!

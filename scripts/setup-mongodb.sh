#!/bin/bash

# ChatGuusPT MongoDB Atlas Setup Script
# This script creates a MongoDB Atlas cluster and database for ChatGuusPT

echo "🚀 ChatGuusPT MongoDB Atlas Setup"
echo "=================================="

# Check if Atlas CLI is installed
if ! command -v atlas &> /dev/null; then
    echo "❌ MongoDB Atlas CLI is not installed"
    echo "📦 Install it with: brew install mongodb-atlas-cli"
    exit 1
fi

echo "✅ MongoDB Atlas CLI found"

# Login to Atlas (if not already logged in)
echo "🔐 Checking Atlas authentication..."
if ! atlas auth whoami &> /dev/null; then
    echo "🔑 Please log in to MongoDB Atlas"
    atlas auth login
else
    echo "✅ Already authenticated to Atlas"
fi

# Project setup
PROJECT_NAME="ChatGuusPT"
CLUSTER_NAME="chatguuspt-cluster"
DB_NAME="chatguuspt"
DB_USER="chatguuspt-user"

echo ""
echo "📋 Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  Cluster: $CLUSTER_NAME"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if project exists or create it
echo "🏗️ Setting up project..."
PROJECT_ID=$(atlas projects list --output json | jq -r ".results[] | select(.name == \"$PROJECT_NAME\") | .id" 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "📁 Creating new project: $PROJECT_NAME"
    PROJECT_ID=$(atlas projects create "$PROJECT_NAME" --output json | jq -r '.id')
    echo "✅ Project created with ID: $PROJECT_ID"
else
    echo "✅ Using existing project: $PROJECT_ID"
fi

# Set the project as default
atlas config set project_id "$PROJECT_ID"

# Check if cluster exists or create it
echo "🖥️ Setting up cluster..."
if atlas clusters describe "$CLUSTER_NAME" --projectId "$PROJECT_ID" &> /dev/null; then
    echo "✅ Cluster $CLUSTER_NAME already exists"
else
    echo "🔧 Creating cluster: $CLUSTER_NAME"
    atlas clusters create "$CLUSTER_NAME" \
        --provider AWS \
        --region US_EAST_1 \
        --tier M0 \
        --diskSizeGB 0.5 \
        --projectId "$PROJECT_ID"
    
    echo "⏳ Waiting for cluster to be ready..."
    atlas clusters watch "$CLUSTER_NAME" --projectId "$PROJECT_ID"
    echo "✅ Cluster created successfully"
fi

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database user
echo "👤 Setting up database user..."
if atlas dbusers describe "$DB_USER" --projectId "$PROJECT_ID" &> /dev/null; then
    echo "✅ Database user $DB_USER already exists"
    echo "🔄 Updating user password..."
    atlas dbusers update "$DB_USER" \
        --password "$DB_PASSWORD" \
        --projectId "$PROJECT_ID"
else
    echo "🔧 Creating database user: $DB_USER"
    atlas dbusers create \
        --username "$DB_USER" \
        --password "$DB_PASSWORD" \
        --role readWriteAnyDatabase \
        --projectId "$PROJECT_ID"
    echo "✅ Database user created"
fi

# Set up network access (allow from anywhere for Netlify)
echo "🌐 Configuring network access..."
atlas accessLists create \
    --type cidrBlock \
    --cidrBlock "0.0.0.0/0" \
    --comment "Allow access from Netlify Functions" \
    --projectId "$PROJECT_ID" 2>/dev/null || echo "✅ Network access already configured"

# Get connection string
echo "🔗 Generating connection string..."
CONNECTION_STRING=$(atlas clusters connectionStrings describe "$CLUSTER_NAME" --projectId "$PROJECT_ID" --type standard --output json | jq -r '.standardSrv')

# Replace password placeholder
FULL_CONNECTION_STRING="${CONNECTION_STRING//<password>/$DB_PASSWORD}"
FULL_CONNECTION_STRING="${FULL_CONNECTION_STRING//test/$DB_NAME}"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Database Details:"
echo "  Project ID: $PROJECT_ID"
echo "  Cluster: $CLUSTER_NAME"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "$FULL_CONNECTION_STRING"
echo ""
echo "⚡ Next Steps:"
echo "1. Add this to your Netlify environment variables:"
echo "   MONGODB_URI=$FULL_CONNECTION_STRING"
echo ""
echo "2. You can also add it to your .env file for local development:"
echo "   echo 'MONGODB_URI=\"$FULL_CONNECTION_STRING\"' >> .env"
echo ""
echo "3. Test the connection:"
echo "   curl 'https://your-site.netlify.app/.netlify/functions/ai-analytics?action=health_check'"
echo ""

# Offer to set up Netlify environment variable
read -p "🤖 Would you like to set up the Netlify environment variable now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v netlify &> /dev/null; then
        echo "🔧 Setting up Netlify environment variable..."
        netlify env:set MONGODB_URI "$FULL_CONNECTION_STRING"
        echo "✅ Environment variable set!"
        echo "🚀 Don't forget to redeploy: npm run deploy"
    else
        echo "❌ Netlify CLI not found. Install it with: npm install -g netlify-cli"
        echo "📝 Please set the environment variable manually in Netlify dashboard"
    fi
fi

# Save connection details to file for reference
cat > mongodb-connection-info.txt << EOF
ChatGuusPT MongoDB Atlas Connection Details
==========================================
Generated: $(date)

Project ID: $PROJECT_ID
Cluster: $CLUSTER_NAME
Database: $DB_NAME
Username: $DB_USER
Password: $DB_PASSWORD

Connection String:
$FULL_CONNECTION_STRING

Dashboard: https://cloud.mongodb.com/v2/$PROJECT_ID

IMPORTANT: Keep this information secure!
EOF

echo "💾 Connection details saved to: mongodb-connection-info.txt"
echo "⚠️  Keep this file secure and don't commit it to git!"

echo ""
echo "🎯 MongoDB Atlas is ready for ChatGuusPT!"
echo "   Visit: https://cloud.mongodb.com/v2/$PROJECT_ID"

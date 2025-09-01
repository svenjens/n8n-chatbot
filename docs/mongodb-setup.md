# MongoDB Atlas Setup Guide

This guide helps you set up MongoDB Atlas for ChatGuusPT's persistent data storage.

## 🚀 **Quick Setup**

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project called "ChatGuusPT"

### 2. Create a Cluster
1. Click "Create a Cluster"
2. Choose **FREE tier** (M0 Sandbox - 512MB)
3. Select a cloud provider and region (closest to your users)
4. Name your cluster: `chatguuspt-cluster`
5. Click "Create Cluster" (takes 1-3 minutes)

### 3. Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user:
   - Username: `chatguuspt-user`
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"
4. Click "Add User"

### 4. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Netlify Functions
   - In production, you can restrict to specific IPs
4. Click "Confirm"

### 5. Get Connection String
1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your user password
6. Replace `<database>` with `chatguuspt`

Example connection string format:
```
mongodb+srv://<username>:<password>@<cluster-name>.<cluster-id>.mongodb.net/<database>?retryWrites=true&w=majority
```

Replace the placeholders with your actual values:
- `<username>`: Your database username
- `<password>`: Your database password  
- `<cluster-name>`: Your cluster name
- `<cluster-id>`: Generated cluster identifier
- `<database>`: Database name (use `chatguuspt`)

## 🔧 **Netlify Configuration**

### Add Environment Variable
1. Go to your Netlify dashboard
2. Select your ChatGuusPT site
3. Go to "Site settings" → "Environment variables"
4. Add new variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
5. Click "Save"

### Deploy
After adding the environment variable, redeploy your site:
```bash
npm run deploy
```

## 📊 **Database Schema**

ChatGuusPT will automatically create these collections:

### `ai_ratings`
```javascript
{
  _id: ObjectId,
  id: "ai_rating_...",
  sessionId: "session_...",
  tenantId: "koepel",
  userQuestion: "How can I book an event?",
  aiResponse: "You can book an event by...",
  rating: {
    overall: 4.2,
    accuracy: 4.5,
    helpfulness: 4.0,
    completeness: 3.8,
    clarity: 4.3,
    relevance: 4.1,
    confidence: 0.85,
    category: "event_inquiry"
  },
  context: {
    responseTime: 1200,
    hasAction: true
  },
  createdAt: Date,
  updatedAt: Date
}
```

### `missing_answers`
```javascript
{
  _id: ObjectId,
  id: "missing_answer_...",
  userQuestion: "What are the cancellation fees?",
  aiResponse: "I'm not sure about the exact fees...",
  category: "service_request",
  priority: "high", // high, medium, low
  frequency: 5,
  status: "needs_review", // needs_review, in_progress, resolved
  tenantId: "koepel",
  sessionId: "session_...",
  rating: { ... },
  createdAt: Date,
  updatedAt: Date
}
```

### `satisfaction_ratings`
```javascript
{
  _id: ObjectId,
  sessionId: "session_...",
  tenantId: "koepel",
  rating: 5, // 1-5 stars
  feedback: "Great service!",
  category: ["helpful", "fast"],
  language: "nl",
  createdAt: Date,
  updatedAt: Date
}
```

### `chat_sessions`
```javascript
{
  _id: ObjectId,
  sessionId: "session_...",
  tenantId: "koepel",
  userFingerprint: "fp_...",
  messages: [
    {
      content: "Hello",
      sender: "user",
      timestamp: Date
    }
  ],
  metadata: {
    userAgent: "...",
    url: "...",
    language: "nl"
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 **Testing the Connection**

### Health Check Endpoint
Test your MongoDB connection:
```bash
curl https://your-site.netlify.app/.netlify/functions/ai-analytics?action=health_check
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.0.0-mongodb"
}
```

### Test AI Rating Storage
After a chat conversation, check if data is being stored:
```bash
curl https://your-site.netlify.app/.netlify/functions/ai-analytics?action=get_ai_ratings&limit=5
```

## 📈 **Monitoring & Maintenance**

### MongoDB Atlas Dashboard
- Monitor database usage and performance
- Set up alerts for high usage
- View slow queries and optimize

### Data Retention
The system automatically:
- Keeps all AI ratings (no automatic deletion)
- Updates missing answer frequencies instead of duplicating
- Caches dashboard data for 5 minutes

### Backup
MongoDB Atlas automatically backs up your data:
- Continuous backups for M10+ clusters
- Point-in-time recovery available
- Manual backup snapshots can be created

## 🚨 **Troubleshooting**

### Common Issues

**"MongoServerError: bad auth"**
- Check your username and password in the connection string
- Ensure the database user has proper permissions

**"MongooseServerSelectionError: connection timed out"**
- Check network access settings in MongoDB Atlas
- Ensure 0.0.0.0/0 is allowed (or add Netlify's IPs)

**"Database connection failed"**
- Verify the connection string format
- Check if the cluster is running
- Test connection from MongoDB Compass

### Debug Mode
Add debugging to your Netlify Functions:
```javascript
// In netlify/functions/ai-analytics.js
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
```

## 🎯 **Production Recommendations**

### Security
- Use MongoDB Atlas IP whitelist instead of 0.0.0.0/0
- Rotate database passwords regularly
- Enable MongoDB Atlas encryption at rest

### Performance
- Create indexes on frequently queried fields:
  ```javascript
  // tenantId for filtering
  db.ai_ratings.createIndex({ "tenantId": 1 })
  
  // createdAt for time-based queries
  db.ai_ratings.createIndex({ "createdAt": -1 })
  
  // sessionId for session-based queries
  db.ai_ratings.createIndex({ "sessionId": 1 })
  ```

### Scaling
- Monitor database size and upgrade cluster when needed
- Consider data archiving for old analytics data
- Use MongoDB Atlas auto-scaling features

## 📞 **Support**

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Review Netlify Function logs
3. Test the connection string with MongoDB Compass
4. Contact MongoDB Atlas support (free tier includes community support)

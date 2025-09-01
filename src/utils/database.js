/**
 * MongoDB Database Connection and Operations
 * Handles persistent storage for ChatGuusPT analytics data
 */

import { MongoClient, ServerApiVersion } from 'mongodb';

let client = null;
let db = null;

/**
 * Initialize MongoDB connection
 */
export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
    });

    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB Atlas!");

    db = client.db('chatguuspt');
    return db;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * AI Ratings Collection Operations
 */
export class AIRatingsDB {
  static async getCollection() {
    const database = await connectToDatabase();
    return database.collection('ai_ratings');
  }

  static async create(ratingData) {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      ...ratingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  }

  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const {
      limit = 50,
      skip = 0,
      sort = { createdAt: -1 },
      ...filters
    } = options;

    return await collection
      .find({ ...query, ...filters })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async count(query = {}) {
    const collection = await this.getCollection();
    return await collection.countDocuments(query);
  }

  static async aggregate(pipeline) {
    const collection = await this.getCollection();
    return await collection.aggregate(pipeline).toArray();
  }

  static async getAnalytics(filters = {}) {
    const collection = await this.getCollection();
    
    // Build match stage
    const matchStage = { ...filters };
    if (filters.period) {
      const cutoffDate = getPeriodCutoff(filters.period);
      matchStage.createdAt = { $gte: cutoffDate };
      delete matchStage.period;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgOverall: { $avg: '$rating.overall' },
          avgAccuracy: { $avg: '$rating.accuracy' },
          avgHelpfulness: { $avg: '$rating.helpfulness' },
          avgCompleteness: { $avg: '$rating.completeness' },
          avgClarity: { $avg: '$rating.clarity' },
          avgRelevance: { $avg: '$rating.relevance' },
          avgConfidence: { $avg: '$rating.confidence' },
          categories: {
            $push: {
              category: '$rating.category',
              overall: '$rating.overall',
              confidence: '$rating.confidence'
            }
          }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results[0] || {
      totalRatings: 0,
      avgOverall: 0,
      avgAccuracy: 0,
      avgHelpfulness: 0,
      avgCompleteness: 0,
      avgClarity: 0,
      avgRelevance: 0,
      avgConfidence: 0,
      categories: []
    };
  }

  static async getTrends(filters = {}) {
    const collection = await this.getCollection();
    
    const matchStage = { ...filters };
    if (filters.period) {
      const cutoffDate = getPeriodCutoff(filters.period);
      matchStage.createdAt = { $gte: cutoffDate };
      delete matchStage.period;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' },
          avgConfidence: { $avg: '$rating.confidence' }
        }
      },
      { $sort: { '_id.date': 1 } },
      {
        $project: {
          date: '$_id.date',
          count: 1,
          avgRating: { $round: ['$avgRating', 2] },
          avgConfidence: { $round: [{ $multiply: ['$avgConfidence', 100] }, 1] },
          _id: 0
        }
      }
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  static async getCategoryBreakdown(filters = {}) {
    const collection = await this.getCollection();
    
    const matchStage = { ...filters };
    if (filters.period) {
      const cutoffDate = getPeriodCutoff(filters.period);
      matchStage.createdAt = { $gte: cutoffDate };
      delete matchStage.period;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$rating.category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 2] },
          _id: 0
        }
      }
    ];

    return await collection.aggregate(pipeline).toArray();
  }
}

/**
 * Missing Answers Collection Operations
 */
export class MissingAnswersDB {
  static async getCollection() {
    const database = await connectToDatabase();
    return database.collection('missing_answers');
  }

  static async create(answerData) {
    const collection = await this.getCollection();
    
    // Check if similar question already exists
    const existing = await collection.findOne({
      userQuestion: { $regex: new RegExp(answerData.userQuestion, 'i') },
      tenantId: answerData.tenantId
    });

    if (existing) {
      // Update frequency and timestamp
      await collection.updateOne(
        { _id: existing._id },
        {
          $inc: { frequency: 1 },
          $set: { 
            updatedAt: new Date(),
            lastRating: answerData.rating
          }
        }
      );
      return existing._id;
    } else {
      // Create new entry
      const result = await collection.insertOne({
        ...answerData,
        frequency: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return result.insertedId;
    }
  }

  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const {
      limit = 50,
      skip = 0,
      sort = { frequency: -1, updatedAt: -1 },
      ...filters
    } = options;

    return await collection
      .find({ ...query, ...filters })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async updateStatus(id, status, notes = '') {
    const collection = await this.getCollection();
    return await collection.updateOne(
      { _id: id },
      {
        $set: {
          status,
          notes,
          updatedAt: new Date()
        }
      }
    );
  }

  static async getAnalytics(filters = {}) {
    const collection = await this.getCollection();
    
    const matchStage = { ...filters };
    if (filters.period) {
      const cutoffDate = getPeriodCutoff(filters.period);
      matchStage.createdAt = { $gte: cutoffDate };
      delete matchStage.period;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          },
          categories: {
            $push: {
              category: '$category',
              priority: '$priority'
            }
          }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results[0] || {
      total: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      categories: []
    };
  }
}

/**
 * Satisfaction Ratings Collection Operations
 */
export class SatisfactionRatingsDB {
  static async getCollection() {
    const database = await connectToDatabase();
    return database.collection('satisfaction_ratings');
  }

  static async create(ratingData) {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      ...ratingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  }

  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const {
      limit = 50,
      skip = 0,
      sort = { createdAt: -1 },
      ...filters
    } = options;

    return await collection
      .find({ ...query, ...filters })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async getAnalytics(filters = {}) {
    const collection = await this.getCollection();
    
    const matchStage = { ...filters };
    if (filters.period) {
      const cutoffDate = getPeriodCutoff(filters.period);
      matchStage.createdAt = { $gte: cutoffDate };
      delete matchStage.period;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          satisfiedCount: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalRatings: 1,
          avgRating: { $round: ['$avgRating', 2] },
          satisfactionRate: {
            $round: [
              { $multiply: [{ $divide: ['$satisfiedCount', '$totalRatings'] }, 100] },
              1
            ]
          }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results[0] || {
      totalRatings: 0,
      avgRating: 0,
      satisfactionRate: 0
    };
  }
}

/**
 * Chat Sessions Collection Operations
 */
export class ChatSessionsDB {
  static async getCollection() {
    const database = await connectToDatabase();
    return database.collection('chat_sessions');
  }

  static async create(sessionData) {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  }

  static async update(sessionId, updateData) {
    const collection = await this.getCollection();
    return await collection.updateOne(
      { sessionId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const {
      limit = 50,
      skip = 0,
      sort = { createdAt: -1 },
      ...filters
    } = options;

    return await collection
      .find({ ...query, ...filters })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}

/**
 * Utility Functions
 */
function getPeriodCutoff(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;
    case 'quarter':
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(now.getMonth() - 3);
      return quarterAgo;
    default:
      return new Date(0); // Beginning of time
  }
}

/**
 * Database Health Check
 */
export async function healthCheck() {
  try {
    const database = await connectToDatabase();
    await database.command({ ping: 1 });
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

// Export default connection function for backwards compatibility
export default connectToDatabase;

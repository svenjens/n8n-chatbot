#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * Tests if we can connect to MongoDB Atlas and perform basic operations
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ MONGODB_URI environment variable not found');
  console.log('📝 Please set up your MongoDB connection string:');
  console.log('   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/chatguuspt"');
  console.log('');
  console.log('🔗 Or get one from MongoDB Atlas:');
  console.log('   1. Go to https://cloud.mongodb.com');
  console.log('   2. Create a free cluster');
  console.log('   3. Get your connection string');
  console.log('   4. Add it to your .env file');
  process.exit(1);
}

console.log('🧪 Testing MongoDB Connection...');
console.log('================================');

async function testConnection() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    console.log('✅ Connected successfully!');

    // Test database access
    const db = client.db('chatguuspt');
    console.log('📊 Testing database access...');
    
    // Test ping
    await db.command({ ping: 1 });
    console.log('✅ Database ping successful!');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name));

    // Test AI Ratings collection
    console.log('🤖 Testing AI Ratings collection...');
    const aiRatings = db.collection('ai_ratings');
    
    // Insert test document
    const testRating = {
      id: 'test_rating_' + Date.now(),
      sessionId: 'test_session',
      tenantId: 'test',
      userQuestion: 'Test question?',
      aiResponse: 'Test response',
      rating: {
        overall: 4.5,
        accuracy: 4.0,
        helpfulness: 5.0,
        completeness: 4.0,
        clarity: 4.5,
        relevance: 4.5,
        confidence: 0.9,
        category: 'test'
      },
      context: { test: true },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await aiRatings.insertOne(testRating);
    console.log('✅ Test AI rating inserted:', insertResult.insertedId);

    // Read back the document
    const foundRating = await aiRatings.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test AI rating retrieved:', foundRating.id);

    // Test aggregation
    const avgRating = await aiRatings.aggregate([
      { $group: { _id: null, avgOverall: { $avg: '$rating.overall' } } }
    ]).toArray();
    console.log('✅ Aggregation test successful:', avgRating);

    // Clean up test data
    await aiRatings.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test data cleaned up');

    // Test Missing Answers collection
    console.log('❓ Testing Missing Answers collection...');
    const missingAnswers = db.collection('missing_answers');
    
    const testMissingAnswer = {
      id: 'test_missing_' + Date.now(),
      userQuestion: 'Test unanswered question?',
      aiResponse: 'Sorry, I don\'t know',
      category: 'test',
      priority: 'high',
      frequency: 1,
      status: 'needs_review',
      tenantId: 'test',
      sessionId: 'test_session',
      rating: { overall: 2.0, confidence: 0.3 },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const missingResult = await missingAnswers.insertOne(testMissingAnswer);
    console.log('✅ Test missing answer inserted:', missingResult.insertedId);

    // Test upsert behavior (frequency increment)
    const existingAnswer = await missingAnswers.findOneAndUpdate(
      { userQuestion: testMissingAnswer.userQuestion, tenantId: 'test' },
      { 
        $inc: { frequency: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    console.log('✅ Frequency update test:', existingAnswer.value.frequency);

    // Clean up
    await missingAnswers.deleteOne({ _id: missingResult.insertedId });
    console.log('✅ Missing answer test data cleaned up');

    // Test Satisfaction Ratings collection
    console.log('⭐ Testing Satisfaction Ratings collection...');
    const satisfactionRatings = db.collection('satisfaction_ratings');
    
    const testSatisfaction = {
      sessionId: 'test_session',
      tenantId: 'test',
      rating: 5,
      feedback: 'Great service!',
      category: ['helpful', 'fast'],
      language: 'nl',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const satisfactionResult = await satisfactionRatings.insertOne(testSatisfaction);
    console.log('✅ Test satisfaction rating inserted:', satisfactionResult.insertedId);

    // Test satisfaction analytics
    const satisfactionAnalytics = await satisfactionRatings.aggregate([
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          satisfiedCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } }
        }
      }
    ]).toArray();
    console.log('✅ Satisfaction analytics test:', satisfactionAnalytics);

    // Clean up
    await satisfactionRatings.deleteOne({ _id: satisfactionResult.insertedId });
    console.log('✅ Satisfaction test data cleaned up');

    console.log('');
    console.log('🎉 All tests passed!');
    console.log('✅ MongoDB Atlas is ready for ChatGuusPT');
    console.log('');
    console.log('📋 Database Info:');
    console.log(`   Database: ${db.databaseName}`);
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Connection: ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`);
    console.log('');
    console.log('🚀 Ready to switch from in-memory to persistent storage!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your connection string format');
    console.log('   2. Verify username/password in MongoDB Atlas');
    console.log('   3. Ensure network access is configured (0.0.0.0/0)');
    console.log('   4. Check if the cluster is running');
    console.log('');
    console.log('💡 Connection string format:');
    console.log('   mongodb+srv://<username>:<password>@<cluster>.<id>.mongodb.net/chatguuspt');
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testConnection();

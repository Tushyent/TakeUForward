const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward');
  const db = mongoose.connection.db;
  const count = await db.collection('communities').countDocuments();
  console.log('Communities count:', count);
  
  const deptDocs = await db.collection('users').distinct('dept');
  console.log('Existing depts:', deptDocs);
  
  process.exit(0);
}

check().catch(console.error);

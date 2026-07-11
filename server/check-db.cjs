const mongoose = require('mongoose');

const writeLine = (message) => {
  process.stdout.write(`${message}\n`);
};

async function check() {
  const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
  const db = mongoose.connection.db;
  const count = await db.collection('communities').countDocuments();
  writeLine(`Communities count: ${count}`);
  
  const deptDocs = await db.collection('users').distinct('dept');
  writeLine(`Existing depts: ${JSON.stringify(deptDocs)}`);
  
  process.exit(0);
}

check().catch((err) => {
  process.stderr.write(`${err.stack || err.message || err}\n`);
  process.exit(1);
});

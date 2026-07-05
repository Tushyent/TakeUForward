const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://nptushyent_db_user:jzBOMCV6Ovw9X2Tg@cluster0.swkevmd.mongodb.net/takeuforward?appName=Cluster0');
  const db = mongoose.connection.db;
  const count = await db.collection('communities').countDocuments();
  console.log('Communities count:', count);
  
  const deptDocs = await db.collection('users').distinct('dept');
  console.log('Existing depts:', deptDocs);
  
  process.exit(0);
}

check().catch(console.error);

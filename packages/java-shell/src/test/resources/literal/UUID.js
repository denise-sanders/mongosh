// before
db.coll.insertOne({"_id": 1, v: UUID('5220b418-8f7d-4cd9-bd27-35b6f8d990c5')});
// command checkResultClass
new UUID('5220b418-8f7d-4cd9-bd27-35b6f8d990c5')
// command checkResultClass
UUID('5220b418-8f7d-4cd9-bd27-35b6f8d990c5')
// command checkResultClass
new UUID()
// command checkResultClass
db.coll.find().toArray()[0].v;
// clear
db.coll.drop();
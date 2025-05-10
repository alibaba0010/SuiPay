import mongoose from "mongoose";

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var, vars-on-top
  var mongoose: { conn: any; promise: any } | undefined;
}

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable");
}

export async function connectDB() {
  let cached = global.mongoose;

  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }

  const mongooseCache = cached as { conn: any; promise: any };
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  //Allow any
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  } catch (e) {
    mongooseCache.promise = null;
    throw e;
  }

  return mongooseCache.conn;
}

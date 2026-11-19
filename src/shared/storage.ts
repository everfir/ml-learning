import { openDB } from "idb";

function openStore() {
  return openDB(`ml-learning:${__EXPERIMENT_ID__}`, 1, {
    upgrade(db) {
      db.createObjectStore("records");
    },
  });
}

// Resolve writes after the transaction commits, including quota errors.
export async function readRecord(key: string): Promise<unknown> {
  const db = await openStore();
  try {
    return await db.get("records", key);
  } finally {
    db.close();
  }
}
export async function writeRecord(key: string, value: unknown) {
  const db = await openStore();
  try {
    await db.put("records", value, key);
  } finally {
    db.close();
  }
}

export async function listRecords(prefix: string): Promise<unknown[]> {
  const db = await openStore();
  try {
    return await db.getAll("records", IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  } finally {
    db.close();
  }
}

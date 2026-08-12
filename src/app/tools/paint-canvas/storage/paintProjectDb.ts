import Dexie, { type Table } from "dexie";

export type PaintAutosaveRecord = {
  id: "current";
  document: string;
  updatedAt: string;
};

class PaintProjectDatabase extends Dexie {
  autosaves!: Table<PaintAutosaveRecord>;

  constructor() {
    super("darma-paint-canvas");
    this.version(1).stores({ autosaves: "id, updatedAt" });
  }
}

let database: PaintProjectDatabase | null = null;

function getDatabase(): PaintProjectDatabase {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  if (!database) database = new PaintProjectDatabase();
  return database;
}

export async function loadPaintAutosave(): Promise<PaintAutosaveRecord | undefined> {
  return getDatabase().autosaves.get("current");
}

export async function savePaintAutosave(document: string): Promise<void> {
  await getDatabase().autosaves.put({ id: "current", document, updatedAt: new Date().toISOString() });
}

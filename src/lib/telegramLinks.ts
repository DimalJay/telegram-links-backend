import { ObjectId } from "mongodb";

import { getMongoClient } from "@/lib/mongodb";

export type TelegramLinkType = "group" | "channel";

export type TelegramLink = {
  id: string;
  name: string;
  description: string;
  category: string;
  isAdultOnly: boolean;
  type: TelegramLinkType;
  link: string;
  createdAt: string;
};

export type CreateTelegramLinkData = Omit<TelegramLink, "id" | "createdAt">;

export type CreateTelegramLinkInput = {
  name?: unknown;
  title?: unknown;
  description: unknown;
  category: unknown;
  isAdultOnly: unknown;
  link: unknown;
  type: unknown;
};

type TelegramLinkDoc = {
  _id: ObjectId;
  name: string;
  description: string;
  category: string;
  isAdultOnly: boolean;
  type: TelegramLinkType;
  link: string;
  createdAt: Date;
};

const COLLECTION = "links";

let ensuredIndexes = false;

async function getCollection() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "telegram_links";
  const db = client.db(dbName);
  const collection = db.collection<TelegramLinkDoc>(COLLECTION);

  if (!ensuredIndexes) {
    ensuredIndexes = true;
    await collection.createIndex({ link: 1 }, { unique: true });
    await collection.createIndex({ type: 1, createdAt: -1 });
  }

  return collection;
}

function toApiModel(doc: TelegramLinkDoc): TelegramLink {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    isAdultOnly: doc.isAdultOnly,
    type: doc.type,
    link: doc.link,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function validateCreateInput(input: CreateTelegramLinkInput): {
  ok: true;
  value: CreateTelegramLinkData;
} | {
  ok: false;
  error: string;
} {
  const nameRaw =
    typeof input.name === "string"
      ? input.name
      : typeof input.title === "string"
        ? input.title
        : "";
  const name = nameRaw.trim();
  if (!name) return { ok: false, error: "name is required" };
  if (name.length > 200) return { ok: false, error: "name is too long" };

  const descriptionRaw = typeof input.description === "string" ? input.description : "";
  const description = descriptionRaw.trim();
  if (!description) return { ok: false, error: "description is required" };
  if (description.length > 2000) return { ok: false, error: "description is too long" };

  const categoryRaw = typeof input.category === "string" ? input.category : "";
  const category = categoryRaw.trim();
  if (!category) return { ok: false, error: "category is required" };
  if (category.length > 100) return { ok: false, error: "category is too long" };

  const isAdultOnly =
    typeof input.isAdultOnly === "boolean"
      ? input.isAdultOnly
      : input.isAdultOnly === "true"
        ? true
        : input.isAdultOnly === "false"
          ? false
          : null;
  if (isAdultOnly === null) {
    return { ok: false, error: "isAdultOnly must be boolean" };
  }

  const type = input.type === "group" || input.type === "channel" ? input.type : null;
  if (!type) return { ok: false, error: "type must be 'group' or 'channel'" };

  const link = typeof input.link === "string" ? input.link.trim() : "";
  if (!link) return { ok: false, error: "link is required" };
  if (link.length > 2048) return { ok: false, error: "link is too long" };

  const normalizedLink = /^https?:\/\//i.test(link) ? link : `https://${link}`;
  try {
    // Ensures it's a valid URL (also helps logo fetching)
    new URL(normalizedLink);
  } catch {
    return { ok: false, error: "link must be a valid URL" };
  }

  return {
    ok: true,
    value: {
      name,
      description,
      category,
      isAdultOnly,
      type,
      link: normalizedLink,
    },
  };
}

export async function addLink(input: CreateTelegramLinkData) {
  const collection = await getCollection();

  try {
    const createdAt = new Date();

    const doc = {
      name: input.name,
      description: input.description,
      category: input.category,
      isAdultOnly: input.isAdultOnly,
      type: input.type,
      link: input.link,
      createdAt,
    };

    const result = await collection.insertOne(doc as any);
    const id = result.insertedId.toHexString();
    const created: TelegramLink = {
      id,
      ...input,
      createdAt: createdAt.toISOString(),
    };

    return { ok: true as const, created };
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await collection.findOne({ link: input.link });
      return {
        ok: false as const,
        reason: "duplicate" as const,
        existing: existing ? toApiModel(existing) : null,
      };
    }
    throw error;
  }
}

export function sortNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listLinks(options?: {
  type?: TelegramLinkType;
  limit?: number;
}): Promise<TelegramLink[]> {
  const collection = await getCollection();
  const filter: any = {};
  if (options?.type) filter.type = options.type;

  const cursor = collection.find(filter).sort({ createdAt: -1 });
  if (options?.limit) cursor.limit(options.limit);
  const docs = await cursor.toArray();
  return docs.map(toApiModel);
}

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listLinksPaginated(options: {
  type?: TelegramLinkType;
  page: number;
  limit: number;
}): Promise<PaginatedResult<TelegramLink>> {
  const collection = await getCollection();
  const filter: any = {};
  if (options.type) filter.type = options.type;

  const total = await collection.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / options.limit));
  const page = Math.min(Math.max(1, options.page), totalPages);
  const skip = (page - 1) * options.limit;

  const docs = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(options.limit)
    .toArray();

  return {
    items: docs.map(toApiModel),
    page,
    limit: options.limit,
    total,
    totalPages,
  };
}

export async function searchLinks(options: {
  query: string;
  type?: TelegramLinkType;
}): Promise<TelegramLink[]> {
  const collection = await getCollection();
  const q = options.query.trim();

  const filter: any = {
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { link: { $regex: q, $options: "i" } },
    ],
  };
  if (options.type) filter.type = options.type;

  const docs = await collection.find(filter).sort({ createdAt: -1 }).toArray();
  return docs.map(toApiModel);
}

export async function searchLinksPaginated(options: {
  query: string;
  type?: TelegramLinkType;
  page: number;
  limit: number;
}): Promise<PaginatedResult<TelegramLink>> {
  const collection = await getCollection();
  const q = options.query.trim();

  const filter: any = {
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { link: { $regex: q, $options: "i" } },
    ],
  };
  if (options.type) filter.type = options.type;

  const total = await collection.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / options.limit));
  const page = Math.min(Math.max(1, options.page), totalPages);
  const skip = (page - 1) * options.limit;

  const docs = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(options.limit)
    .toArray();

  return {
    items: docs.map(toApiModel),
    page,
    limit: options.limit,
    total,
    totalPages,
  };
}

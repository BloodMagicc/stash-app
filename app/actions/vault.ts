"use server";

import { dbClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function saveEncryptedRecord(recordType: "ACCOUNT" | "SNAPSHOT", ciphertext: string, iv: string) {
  const user = await getAuthenticatedUser();
  const id = crypto.randomUUID();

  await dbClient.execute({
    sql: `INSERT INTO encrypted_vault (id, user_id, record_type, encrypted_payload, iv) VALUES (?, ?, ?, ?, ?)`,
    args: [id, user.id, recordType, ciphertext, iv],
  });

  return { success: true, id };
}

export async function fetchEncryptedRecords(recordType: "ACCOUNT" | "SNAPSHOT") {
  const user = await getAuthenticatedUser();

  const result = await dbClient.execute({
    sql: `SELECT id, encrypted_payload, iv, created_at FROM encrypted_vault WHERE user_id = ? AND record_type = ? ORDER BY created_at DESC`,
    args: [user.id, recordType],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    ciphertext: row.encrypted_payload as string,
    iv: row.iv as string,
    createdAt: row.created_at as string,
  }));
}

export async function deleteEncryptedRecord(recordId: string) {
  const user = await getAuthenticatedUser();

  await dbClient.execute({
    sql: `DELETE FROM encrypted_vault WHERE id = ? AND user_id = ?`,
    args: [recordId, user.id],
  });

  return { success: true };
}

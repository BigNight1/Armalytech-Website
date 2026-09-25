#!/usr/bin/env ts-node
/* eslint-disable no-console */
import 'reflect-metadata';
import path from 'node:path';
import Database from 'better-sqlite3';
import mongoose from 'mongoose';
import { applyDnsServersOverride } from '../src/shared/config/dns';
import {
  CashClosingRowSchema,
  CashClosingRowModel,
} from '../src/cash-closings/infrastructure/schemas/cash-closing-row.schema';

interface SqliteCierreRow {
  fecha: string;
  fila_index: number;
  ingreso_efectivo: number;
  ingreso_yape: number;
  detalle_ingreso: string | null;
  gasto_efectivo: number;
  gasto_yape: number;
  detalle_gasto: string | null;
}

interface Counts {
  cashClosingRowsCreated: number;
  cashClosingRowsUpdated: number;
}

function printHelp(): void {
  console.log(`Usage: ts-node scripts/migrate-sqlite.ts <path-to-sqlite-file> [options]

Migrates cierre_dia rows from the Invetario-Armalytech desktop app's SQLite
database into MongoDB, idempotently (upsert by natural key: date + rowIndex).

Inventory v2 (brands, phones, categories, products) starts empty and is not
migrated: the old brands/models/parts tables from the desktop app are test
data (ADR 0006, "Actualización 2026-09-25").

Options:
  --dry-run     Read the SQLite file and print the counts that would be
                written, without touching MongoDB.
  --help, -h    Show this help message.

Environment:
  MONGODB_URI   Mongo connection string (required unless --dry-run).
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exitCode = args.length === 0 ? 1 : 0;
    return;
  }

  const dryRun = args.includes('--dry-run');
  const sqlitePath = args.find((a) => !a.startsWith('--'));

  if (!sqlitePath) {
    console.error('Error: missing <path-to-sqlite-file> argument.\n');
    printHelp();
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(sqlitePath);
  const db = new Database(resolvedPath, { readonly: true, fileMustExist: true });

  const cierreRows = db
    .prepare(
      'SELECT fecha, fila_index, ingreso_efectivo, ingreso_yape, detalle_ingreso, gasto_efectivo, gasto_yape, detalle_gasto FROM cierre_dia',
    )
    .all() as SqliteCierreRow[];

  db.close();

  console.log(`Read from SQLite: ${cierreRows.length} cash-closing rows.`);

  if (dryRun) {
    console.log('[dry-run] No writes performed.');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is required to write to MongoDB.');
    process.exitCode = 1;
    return;
  }

  applyDnsServersOverride();
  await mongoose.connect(mongoUri);

  const CashClosingMongoModel = mongoose.model(
    CashClosingRowModel.name,
    CashClosingRowSchema,
  );

  const counts: Counts = {
    cashClosingRowsCreated: 0,
    cashClosingRowsUpdated: 0,
  };

  // Cash-closing rows: idempotent by (date, rowIndex).
  for (const row of cierreRows) {
    const existing = await CashClosingMongoModel.findOne({
      date: row.fecha,
      rowIndex: row.fila_index,
    }).exec();
    const data = {
      cashIncome: row.ingreso_efectivo,
      yapeIncome: row.ingreso_yape,
      incomeDetail: row.detalle_ingreso ?? '',
      cashExpense: row.gasto_efectivo,
      yapeExpense: row.gasto_yape,
      expenseDetail: row.detalle_gasto ?? '',
    };
    if (existing) {
      await existing.updateOne({ $set: data }).exec();
      counts.cashClosingRowsUpdated += 1;
    } else {
      await CashClosingMongoModel.create({
        date: row.fecha,
        rowIndex: row.fila_index,
        ...data,
      });
      counts.cashClosingRowsCreated += 1;
    }
  }

  await mongoose.disconnect();

  console.log('Migration complete:');
  console.log(
    `  cash-closing rows: ${counts.cashClosingRowsCreated} created, ${counts.cashClosingRowsUpdated} updated`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

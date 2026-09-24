#!/usr/bin/env ts-node
/* eslint-disable no-console */
import 'reflect-metadata';
import path from 'node:path';
import Database from 'better-sqlite3';
import mongoose from 'mongoose';
import { applyDnsServersOverride } from '../src/shared/config/dns';
import { BrandSchema, BrandModel } from '../src/inventory/infrastructure/schemas/brand.schema';
import {
  InventoryModelSchema,
  InventoryModelSchemaClass,
} from '../src/inventory/infrastructure/schemas/model.schema';
import { PartSchema, PartModel } from '../src/inventory/infrastructure/schemas/part.schema';
import {
  CashClosingRowSchema,
  CashClosingRowModel,
} from '../src/cash-closings/infrastructure/schemas/cash-closing-row.schema';

interface SqliteBrandRow {
  id: number;
  name: string;
}

interface SqliteModelRow {
  id: number;
  brand_id: number;
  name: string;
}

interface SqlitePartRow {
  id: number;
  model_id: number;
  name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
}

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
  brandsCreated: number;
  brandsUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  partsCreated: number;
  partsUpdated: number;
  cashClosingRowsCreated: number;
  cashClosingRowsUpdated: number;
}

function printHelp(): void {
  console.log(`Usage: ts-node scripts/migrate-sqlite.ts <path-to-sqlite-file> [options]

Migrates brands, models, parts and cierre_dia rows from the Invetario-Armalytech
desktop app's SQLite database into MongoDB, idempotently (upsert by natural key:
brand name; brand + model name; model + part name; date + rowIndex).

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

  const brands = db.prepare('SELECT id, name FROM brands').all() as SqliteBrandRow[];
  const models = db
    .prepare('SELECT id, brand_id, name FROM models')
    .all() as SqliteModelRow[];
  const parts = db
    .prepare(
      'SELECT id, model_id, name, quantity, purchase_price, sale_price FROM parts',
    )
    .all() as SqlitePartRow[];
  const cierreRows = db
    .prepare(
      'SELECT fecha, fila_index, ingreso_efectivo, ingreso_yape, detalle_ingreso, gasto_efectivo, gasto_yape, detalle_gasto FROM cierre_dia',
    )
    .all() as SqliteCierreRow[];

  db.close();

  console.log(
    `Read from SQLite: ${brands.length} brands, ${models.length} models, ${parts.length} parts, ${cierreRows.length} cash-closing rows.`,
  );

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

  const BrandMongoModel = mongoose.model(BrandModel.name, BrandSchema);
  const ModelMongoModel = mongoose.model(
    InventoryModelSchemaClass.name,
    InventoryModelSchema,
  );
  const PartMongoModel = mongoose.model(PartModel.name, PartSchema);
  const CashClosingMongoModel = mongoose.model(
    CashClosingRowModel.name,
    CashClosingRowSchema,
  );

  const counts: Counts = {
    brandsCreated: 0,
    brandsUpdated: 0,
    modelsCreated: 0,
    modelsUpdated: 0,
    partsCreated: 0,
    partsUpdated: 0,
    cashClosingRowsCreated: 0,
    cashClosingRowsUpdated: 0,
  };

  // 1. Brands: idempotent by case-insensitive name.
  const brandIdMap = new Map<number, mongoose.Types.ObjectId>();
  for (const brand of brands) {
    const nameLower = brand.name.trim().toLowerCase();
    const existing = await BrandMongoModel.findOne({ nameLower }).exec();
    if (existing) {
      counts.brandsUpdated += 1;
      brandIdMap.set(brand.id, existing._id);
    } else {
      const created = await BrandMongoModel.create({ name: brand.name, nameLower });
      counts.brandsCreated += 1;
      brandIdMap.set(brand.id, created._id);
    }
  }

  // 2. Models: idempotent by (brandId, name).
  const modelIdMap = new Map<number, mongoose.Types.ObjectId>();
  for (const model of models) {
    const brandId = brandIdMap.get(model.brand_id);
    if (!brandId) {
      console.warn(`Skipping model "${model.name}": unknown brand_id ${model.brand_id}.`);
      continue;
    }
    const existing = await ModelMongoModel.findOne({ brandId, name: model.name }).exec();
    if (existing) {
      counts.modelsUpdated += 1;
      modelIdMap.set(model.id, existing._id);
    } else {
      const created = await ModelMongoModel.create({ brandId, name: model.name });
      counts.modelsCreated += 1;
      modelIdMap.set(model.id, created._id);
    }
  }

  // 3. Parts: idempotent by (modelId, name).
  for (const part of parts) {
    const modelId = modelIdMap.get(part.model_id);
    if (!modelId) {
      console.warn(`Skipping part "${part.name}": unknown model_id ${part.model_id}.`);
      continue;
    }
    const existing = await PartMongoModel.findOne({ modelId, name: part.name }).exec();
    const data = {
      quantity: part.quantity,
      purchasePrice: part.purchase_price,
      salePrice: part.sale_price,
    };
    if (existing) {
      await existing.updateOne({ $set: data }).exec();
      counts.partsUpdated += 1;
    } else {
      await PartMongoModel.create({ modelId, name: part.name, ...data });
      counts.partsCreated += 1;
    }
  }

  // 4. Cash-closing rows: idempotent by (date, rowIndex).
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
    `  brands:            ${counts.brandsCreated} created, ${counts.brandsUpdated} already present`,
  );
  console.log(
    `  models:            ${counts.modelsCreated} created, ${counts.modelsUpdated} already present`,
  );
  console.log(
    `  parts:             ${counts.partsCreated} created, ${counts.partsUpdated} updated`,
  );
  console.log(
    `  cash-closing rows: ${counts.cashClosingRowsCreated} created, ${counts.cashClosingRowsUpdated} updated`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

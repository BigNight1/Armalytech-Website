import { CashClosingRow } from '../../domain/cash-closing-row.entity';
import {
  CashClosingRepository,
  UpsertCashClosingRowInput,
} from '../../domain/cash-closing-repository.port';

export class FakeCashClosingRepository implements CashClosingRepository {
  rows: CashClosingRow[] = [];
  private seq = 1;

  async upsert(
    date: string,
    rowIndex: number,
    input: UpsertCashClosingRowInput,
  ): Promise<CashClosingRow> {
    const existing = this.rows.find(
      (r) => r.date === date && r.rowIndex === rowIndex,
    );
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const row: CashClosingRow = {
      id: String(this.seq++),
      date,
      rowIndex,
      ...input,
    };
    this.rows.push(row);
    return row;
  }

  async delete(date: string, rowIndex: number): Promise<boolean> {
    const idx = this.rows.findIndex(
      (r) => r.date === date && r.rowIndex === rowIndex,
    );
    if (idx === -1) return false;
    this.rows.splice(idx, 1);
    return true;
  }

  async findByRange(from: string, to: string): Promise<CashClosingRow[]> {
    return this.rows
      .filter((r) => r.date >= from && r.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || a.rowIndex - b.rowIndex);
  }
}

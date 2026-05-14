import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').default('worker').notNull(), // 'admin' | 'worker'
  isApproved: integer('is_approved', { mode: 'boolean' }).default(false).notNull(),
  farmName: text('farm_name'),
  monthlySalary: real('monthly_salary').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const salaryPayments = sqliteTable('salary_payments', {
  id: text('id').primaryKey(),
  workerId: text('worker_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  month: text('month').notNull(), // 'January', etc.
  year: integer('year').notNull(),
  description: text('description'),
});

export const batches = sqliteTable('batches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  initialChicks: integer('initial_chicks').notNull(),
  costPerChick: real('cost_per_chick').notNull(),
  breed: text('breed').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'closed'
  closedDate: integer('closed_date', { mode: 'timestamp' }),
});

export const dailyLogs = sqliteTable('daily_logs', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  date: integer('date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  mortalityCount: integer('mortality_count').notNull(),
  mortalityReason: text('mortality_reason'),
  mortalityImageUrl: text('mortality_image_url'),
  feedUsedKg: real('feed_used_kg').default(0),
  medicineDetails: text('medicine_details'),
  workerId: text('worker_id').references(() => users.id).notNull(),
  workerName: text('worker_name').notNull(),
});

export const feedRecords = sqliteTable('feed_records', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  date: integer('date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  bagCount: integer('bag_count').notNull(),
  pricePerBag: real('price_per_bag').notNull(),
  totalAmount: real('total_amount').notNull(),
  slipImageUrl: text('slip_image_url'),
});

export const medicineGuidelines = sqliteTable('medicine_guidelines', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  prescriptionImageUrl: text('prescription_image_url'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id),
  category: text('category').notNull(), // 'electricity' | 'other' | 'feed' | 'medicine' | 'equipment'
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
});

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  date: integer('date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  quantity: integer('quantity').notNull(),
  weightKg: real('weight_kg').notNull(),
  pricePerKg: real('price_per_kg').notNull(),
  totalAmount: real('total_amount').notNull(),
  receiptImageUrl: text('receipt_image_url'),
});

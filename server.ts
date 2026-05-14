import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config();

import * as schema from './src/db/schema';
import { eq, desc } from 'drizzle-orm';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'kharmar_bondhu_secret_123';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite, { schema });

async function startServer() {
  console.log("Initializing database...");
  try {
    // Initialize tables for SQLite
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'worker',
        is_approved INTEGER NOT NULL DEFAULT 0,
        farm_name TEXT,
        monthly_salary REAL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        initial_chicks INTEGER NOT NULL,
        cost_per_chick REAL NOT NULL,
        breed TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        closed_date INTEGER
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES batches(id),
        date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        mortality_count INTEGER NOT NULL,
        mortality_reason TEXT,
        mortality_image_url TEXT,
        feed_used_kg REAL DEFAULT 0,
        medicine_details TEXT,
        worker_id TEXT NOT NULL REFERENCES users(id),
        worker_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feed_records (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES batches(id),
        date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        bag_count INTEGER NOT NULL,
        price_per_bag REAL NOT NULL,
        total_amount REAL NOT NULL,
        slip_image_url TEXT
      );
      
      CREATE TABLE IF NOT EXISTS medicine_guidelines (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        prescription_image_url TEXT,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS salary_payments (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        batch_id TEXT REFERENCES batches(id),
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        description TEXT NOT NULL,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES batches(id),
        date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        quantity INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        price_per_kg REAL NOT NULL,
        total_amount REAL NOT NULL,
        receipt_image_url TEXT
      );
    `);

    // Migration logic
    const tableInfoUsers = sqlite.prepare("PRAGMA table_info(users)").all();
    const hasSalary = (tableInfoUsers as any[]).some(col => col.name === 'monthly_salary');
    if (!hasSalary) {
      sqlite.exec("ALTER TABLE users ADD COLUMN monthly_salary REAL DEFAULT 0");
    }

    const hasApproved = (tableInfoUsers as any[]).some(col => col.name === 'is_approved');
    if (!hasApproved) {
      sqlite.exec("ALTER TABLE users ADD COLUMN is_approved INTEGER NOT NULL DEFAULT 0");
      // Set existing admins as approved
      sqlite.exec("UPDATE users SET is_approved = 1 WHERE role = 'admin'");
    }

    const tableInfoLogs = sqlite.prepare("PRAGMA table_info(daily_logs)").all();
    const hasFeedUsed = (tableInfoLogs as any[]).some(col => col.name === 'feed_used_kg');
    if (!hasFeedUsed) {
      sqlite.exec("ALTER TABLE daily_logs ADD COLUMN feed_used_kg REAL DEFAULT 0");
    }

    const tableInfoSales = sqlite.prepare("PRAGMA table_info(sales)").all();
    const hasReceiptImage = (tableInfoSales as any[]).some(col => col.name === 'receipt_image_url');
    if (!hasReceiptImage) {
      sqlite.exec("ALTER TABLE sales ADD COLUMN receipt_image_url TEXT");
    }

    const tableInfoMed = sqlite.prepare("PRAGMA table_info(medicine_guidelines)").all();
    const hasPrescriptionImage = (tableInfoMed as any[]).some(col => col.name === 'prescription_image_url');
    if (!hasPrescriptionImage) {
      sqlite.exec("ALTER TABLE medicine_guidelines ADD COLUMN prescription_image_url TEXT");
    }

    const tableInfoExpenses = sqlite.prepare("PRAGMA table_info(expenses)").all();
    const hasExpenseImage = (tableInfoExpenses as any[]).some(col => col.name === 'image_url');
    if (!hasExpenseImage) {
      sqlite.exec("ALTER TABLE expenses ADD COLUMN image_url TEXT");
    }

    console.log("Database tables initialized successfully.");

    // Seed admin user if it doesn't exist or fix password
    const adminPhones = ['+8801737894675', '+8801831445778', '+8801819251747'];
    const newAdminPassword = '@as38sayed';
    const hashedAdminPassword = await bcrypt.hash(newAdminPassword, 10);

    for (const phone of adminPhones) {
      const existing = sqlite.prepare("SELECT * FROM users WHERE phone_number = ?").get(phone);
      if (!existing) {
        sqlite.prepare("INSERT INTO users (id, phone_number, password, name, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)")
          .run(nanoid(), phone, hashedAdminPassword, 'Admin', 'admin', 1);
        console.log(`Admin user seeded: ${phone}`);
      } else {
        // Force update password for admin phones to ensure it matches the requested one
        sqlite.prepare("UPDATE users SET password = ?, role = 'admin', is_approved = 1 WHERE phone_number = ?")
          .run(hashedAdminPassword, phone);
        console.log(`Admin password updated for: ${phone}`);
      }
    }
  } catch (dbError) {
    console.error("Database initialization failed:", dbError);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors());

  // API Routes
  
  // Database connection helper
  const getDb = () => db;

  // Date parsing middleware helper
  const withDateParsing = (handler: (req: express.Request, res: express.Response) => Promise<any>) => {
    return async (req: express.Request, res: express.Response) => {
      try {
        const dateFields = ['date', 'startDate', 'closedDate', 'createdAt', 'updatedAt'];
        for (const field of dateFields) {
          if (req.body && req.body[field] && typeof req.body[field] === 'string') {
            const date = new Date(req.body[field]);
            if (!isNaN(date.getTime())) {
              req.body[field] = date;
            }
          }
        }
        await handler(req, res);
      } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: (error as Error).message });
      }
    };
  };

  // Auth Middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, decoded.id),
      });

      if (!user) return res.sendStatus(403);
      req.user = user;
      next();
    } catch (err) {
      return res.sendStatus(403);
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Access denied. Admins only." });
    }
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phoneNumber, password, name, farmName } = req.body;
      if (!phoneNumber || !password || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const adminPhones = ['+8801737894675', '+8801831445778', '+8801819251747'];
      const isAdminReserving = adminPhones.includes(phoneNumber);

      if (isAdminReserving) {
        return res.status(400).json({ error: "এই নাম্বারটি এডমিন হিসেবে সংরক্ষিত। দয়া করে লগইন করুন।" });
      }

      const db = getDb();
      
      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this phone number" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = nanoid();

      const isAdminUser = phoneNumber === '+8801737894675' || phoneNumber === '+8801831445778' || phoneNumber === '+8801819251747';
      
      const newUser = {
        id: userId,
        phoneNumber,
        password: hashedPassword,
        name,
        farmName,
        role: isAdminUser ? 'admin' : 'worker',
        isApproved: isAdminUser ? true : false,
      };

      await db.insert(schema.users).values(newUser);

      const token = jwt.sign({ id: userId, phoneNumber }, JWT_SECRET);
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      const db = getDb();

      const user = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid phone number or password" });
      }

      if (!user.isApproved && user.role !== 'admin') {
        return res.status(403).json({ error: "আপনার অ্যাকাউন্টটি এখনো অ্যাপ্রুভ করা হয়নি। দয়া করে এডমিনের সাথে যোগাযোগ করুন।" });
      }

      const token = jwt.sign({ id: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/workers", authenticateToken, isAdmin, async (req, res) => {
    console.log("Adding worker:", req.body.phoneNumber);
    try {
      const { phoneNumber, password, name, monthlySalary } = req.body;
      if (!phoneNumber || !password || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const db = getDb();
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (existingUser) {
        console.log("Worker already exists:", phoneNumber);
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = nanoid();

      const newUser = {
        id: userId,
        phoneNumber,
        password: hashedPassword,
        name,
        role: 'worker' as const,
        monthlySalary: monthlySalary || 0,
        isApproved: true,
      };

      await db.insert(schema.users).values(newUser);
      console.log("Worker added successfully:", userId);
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Add Worker Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, req.user.id),
      });

      if (!user) return res.sendStatus(404);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // User Routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, req.params.id),
      });
      res.json(user || null);
    } catch (error) {
      console.error("GET User Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/users", authenticateToken, withDateParsing(async (req: any, res: any) => {
    const db = getDb();
    const updates = req.body;
    
    // Only allow users to update themselves, or admins to update anyone
    if (req.user.role !== 'admin' && req.user.id !== updates.id && req.user.id !== updates.uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Standardize ID
    const userId = updates.id || updates.uid;
    if (!userId) return res.status(400).json({ error: "Missing user ID" });

    // Prevent non-admins from changing roles or approval status
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.isApproved;
      delete updates.phoneNumber; // Don't allow phone change to avoid collisions or hijacking
    }

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    try {
      await db.insert(schema.users).values({ ...updates, id: userId }).onConflictDoUpdate({
        target: schema.users.id,
        set: updates,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Save User Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }));

  // Batch Routes
  app.get("/api/batches", async (req, res) => {
    try {
      const db = getDb();
      const batches = await db.query.batches.findMany({
        orderBy: [desc(schema.batches.startDate)],
      });
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/batches/:id", async (req, res) => {
    try {
      const db = getDb();
      const batch = await db.query.batches.findFirst({
        where: eq(schema.batches.id, req.params.id),
      });
      res.json(batch || null);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/batches", authenticateToken, isAdmin, withDateParsing(async (req: any, res: any) => {
    const db = getDb();
    const batchData = { id: nanoid(), ...req.body };
    await db.insert(schema.batches).values(batchData);
    res.json(batchData);
  }));

  // Batch Routes Extensions
  app.get("/api/batches/:batchId/logs", async (req, res) => {
    try {
      const db = getDb();
      const logs = await db.query.dailyLogs.findMany({
        where: eq(schema.dailyLogs.batchId, req.params.batchId),
        orderBy: [desc(schema.dailyLogs.date)],
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/batches/:batchId/expenses", async (req, res) => {
    try {
      const db = getDb();
      const expenses = await db.query.expenses.findMany({
        where: eq(schema.expenses.batchId, req.params.batchId),
        orderBy: [desc(schema.expenses.date)],
      });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/batches/:batchId/sales", async (req, res) => {
    try {
      const db = getDb();
      const sales = await db.query.sales.findMany({
        where: eq(schema.sales.batchId, req.params.batchId),
        orderBy: [desc(schema.sales.date)],
      });
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/batches/:id/status", withDateParsing(async (req, res) => {
    const db = getDb();
    const { status } = req.body;
    await db.update(schema.batches)
      .set({ 
        status: status as any,
        closedDate: status === 'closed' ? new Date() : null
      })
      .where(eq(schema.batches.id, req.params.id));
    res.json({ success: true });
  }));

  app.post("/api/sales", withDateParsing(async (req, res) => {
    const db = getDb();
    const saleData = { id: nanoid(), ...req.body };
    await db.insert(schema.sales).values(saleData);
    res.json(saleData);
  }));

  app.patch("/api/sales/:id", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    const db = getDb();
    await db.update(schema.sales)
      .set(req.body)
      .where(eq(schema.sales.id, req.params.id));
    res.json({ success: true });
  }));

  app.post("/api/logs", withDateParsing(async (req, res) => {
    const db = getDb();
    const logData = { id: nanoid(), ...req.body };
    await db.insert(schema.dailyLogs).values(logData);
    res.json(logData);
  }));

  app.patch("/api/logs/:id", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    const db = getDb();
    await db.update(schema.dailyLogs)
      .set(req.body)
      .where(eq(schema.dailyLogs.id, req.params.id));
    res.json({ success: true });
  }));

  // Expense Routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const db = getDb();
      const expenses = await db.query.expenses.findMany({
        orderBy: [desc(schema.expenses.date)],
      });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/expenses", withDateParsing(async (req, res) => {
    const db = getDb();
    const expenseData = { id: nanoid(), ...req.body };
    await db.insert(schema.expenses).values(expenseData);
    res.json(expenseData);
  }));

  app.patch("/api/expenses/:id", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    const db = getDb();
    await db.update(schema.expenses)
      .set(req.body)
      .where(eq(schema.expenses.id, req.params.id));
    res.json({ success: true });
  }));

  // Feed Record Routes
  app.get("/api/batches/:batchId/feed", async (req, res) => {
    try {
      const db = getDb();
      const records = await db.query.feedRecords.findMany({
        where: eq(schema.feedRecords.batchId, req.params.batchId),
        orderBy: [desc(schema.feedRecords.date)],
      });
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/feed", withDateParsing(async (req, res) => {
    const db = getDb();
    const feedData = { id: nanoid(), ...req.body };
    await db.insert(schema.feedRecords).values(feedData);
    res.json(feedData);
  }));

  app.patch("/api/feed/:id", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    const db = getDb();
    await db.update(schema.feedRecords)
      .set(req.body)
      .where(eq(schema.feedRecords.id, req.params.id));
    res.json({ success: true });
  }));

  // Salary and Worker Routes
  app.get("/api/workers", authenticateToken, isAdmin, async (req, res) => {
    try {
      const db = getDb();
      const users = await db.query.users.findMany({
        where: eq(schema.users.role, 'worker'),
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/pending-users", authenticateToken, isAdmin, async (req, res) => {
    try {
      const db = getDb();
      const users = await db.query.users.findMany({
        where: eq(schema.users.isApproved, false),
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/approve-user/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
      const db = getDb();
      await db.update(schema.users)
        .set({ isApproved: true })
        .where(eq(schema.users.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/reject-user/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
      const db = getDb();
      await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/users/:id/salary", authenticateToken, isAdmin, async (req, res) => {
    try {
      const db = getDb();
      const { monthlySalary } = req.body;
      await db.update(schema.users)
        .set({ monthlySalary })
        .where(eq(schema.users.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/salary-payments/:workerId", authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      // Only admins can see others, workers see only their own
      if (req.user.role !== 'admin' && req.user.id !== req.params.workerId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const payments = await db.query.salaryPayments.findMany({
        where: eq(schema.salaryPayments.workerId, req.params.workerId),
        orderBy: [desc(schema.salaryPayments.date)],
      });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/salary-payments", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    try {
      const db = getDb();
      const paymentData = { id: nanoid(), ...req.body };
      await db.insert(schema.salaryPayments).values(paymentData);
      res.json(paymentData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }));

  app.patch("/api/salary-payments/:id", authenticateToken, isAdmin, withDateParsing(async (req, res) => {
    try {
      const db = getDb();
      await db.update(schema.salaryPayments)
        .set(req.body)
        .where(eq(schema.salaryPayments.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }));

  // Medicine Guideline Routes
  app.get("/api/medicine-guidelines", async (req, res) => {
    try {
      const db = getDb();
      const guidelines = await db.query.medicineGuidelines.findMany({
        orderBy: [desc(schema.medicineGuidelines.updatedAt)],
      });
      res.json(guidelines);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/medicine-guidelines", async (req, res) => {
    try {
      const db = getDb();
      const guidelineData = { 
        id: nanoid(), 
        ...req.body,
        updatedAt: new Date()
      };
      await db.insert(schema.medicineGuidelines).values(guidelineData);
      res.json(guidelineData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/medicine-guidelines/:id", async (req, res) => {
    try {
      const db = getDb();
      await db.delete(schema.medicineGuidelines).where(eq(schema.medicineGuidelines.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serving from the dist folder relative to the root
    const distPath = path.join(process.cwd(), "dist");
    console.log(`[Production] Serving static files from: ${distPath}`);
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Serve index.html for all other routes (SPA)
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      console.log(`[Production] Request: ${req.url} -> serving ${indexPath}`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Production] Error sending index.html: ${err.message}`);
          res.status(500).send("সার্ভার সমস্যা: ইনডেক্স ফাইল পাওয়া যায়নি। দয়া করে আবার 'Share' বাটনে ক্লিক করে অ্যাপটি আপডেট করুন।");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);

import express from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Konfiguracja PostgreSQL
const pool = new Pool({
  connectionString: "postgresql://zamowienia_8cla_user:qqD2p9nz2OBmFFPRrD2FTgcXrzgCwcYh@dpg-d12u57be5dus73cq9cr0-a.frankfurt-postgres.render.com/zamowienia_8cla",
  ssl: {
    rejectUnauthorized: false
  }
});

// Funkcja inicjalizująca tabele
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Tworzenie tabeli orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tworzenie tabeli order_items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL
      );
    `);
    
    console.log('Tabele zostały zweryfikowane');
    client.release();
  } catch (error) {
    console.error('Błąd podczas inicjalizacji tabel:', error);
  }
}

// Endpoint do zapisu zamówień
app.post('/api/order', async (req, res) => {
  const { name, email, phone, address, payment, cart } = req.body;

  try {
    const client = await pool.connect();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await client.query('BEGIN');

    // Zapisz nagłówek zamówienia
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, email, phone, address, payment_method, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, email, phone, address, payment, total]
    );
    
    const orderId = orderResult.rows[0].id;

    // Zapisz pozycje zamówienia
    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.id, item.name, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Błąd zapisu zamówienia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Start serwera
const PORT = 10000;
app.listen(PORT, async () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  await initializeDatabase();
});

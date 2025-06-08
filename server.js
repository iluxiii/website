const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja połączenia z PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Sprawdzenie połączenia z bazą danych przy starcie
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        customer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        cart_items JSONB NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL
      )
    `);
    console.log('Database connection established and table verified');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint do zapisu zamówień
app.post('/api/order', async (req, res) => {
  try {
    const { name, email, phone, address, payment, cart } = req.body;
    
    // Walidacja danych
    if (!name || !email || !phone || !address || !payment || !cart || cart.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Brakujące dane zamówienia' 
      });
    }

    // Obliczanie łącznej kwoty
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Zapis do bazy danych
    const result = await pool.query(
      `INSERT INTO orders (
        customer_name, 
        email, 
        phone, 
        address, 
        payment_method, 
        cart_items,
        total_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, email, phone, address, payment, JSON.stringify(cart), total]
    );

    res.status(201).json({ 
      success: true,
      orderId: result.rows[0].id,
      paymentMethod: payment
    });
    
  } catch (error) {
    console.error('Błąd zapisu zamówienia:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera podczas przetwarzania zamówienia' 
    });
  }
});

// Endpoint do pobierania zamówień (dla panelu admina)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Błąd pobierania zamówień:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Routing SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicjalizacja i start serwera
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
    console.log(`Podgląd zamówień: http://localhost:${PORT}/api/orders`);
  });
});

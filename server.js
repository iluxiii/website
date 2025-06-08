const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Dodane pakiety dla bazy danych
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Nowy endpoint do zapisywania zamówień
app.post('/api/order', async (req, res) => {
  try {
    const { name, email, phone, address, payment, cart } = req.body;
    
    // Zapisz zamówienie do bazy danych
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
      [
        name,
        email,
        phone,
        address,
        payment,
        JSON.stringify(cart),
        cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      ]
    );

    res.status(201).json({ 
      success: true,
      orderId: result.rows[0].id,
      paymentMethod: payment
    });
    
  } catch (error) {
    console.error('Błąd zapisu zamówienia:', error);
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

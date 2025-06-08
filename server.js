const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();

// Middleware
app.use(bodyParser.json());

// Konfiguracja połączenia z PostgreSQL
const pool = new Pool({
  connectionString: "postgresql://zamowienia_8cla_user:qqD2p9nz2OBmFFPRrD2FTgcXrzgCwcYh@dpg-d12u57be5dus73cq9cr0-a.frankfurt-postgres.render.com/zamowienia_8cla",
  ssl: {
    rejectUnauthorized: false // Wymagane dla Render.com
  }
});

// Endpoint do zapisu zamówień
app.post('/api/order', async (req, res) => {
  const { name, email, phone, address, payment, cart } = req.body;

  try {
    const client = await pool.connect();
    
    // Obliczanie sumy zamówienia
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Rozpoczęcie transakcji
    await client.query('BEGIN');

    // Zapis nagłówka zamówienia
    const orderQuery = `
      INSERT INTO orders (customer_name, email, phone, address, payment_method, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`;
    
    const orderResult = await client.query(orderQuery, [
      name,
      email,
      phone,
      address,
      payment,
      total
    ]);
    
    const orderId = orderResult.rows[0].id;

    // Zapis pozycji zamówienia
    for (const item of cart) {
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
        VALUES ($1, $2, $3, $4, $5)`;
      
      await client.query(itemQuery, [
        orderId,
        item.id,
        item.name,
        item.quantity,
        item.price
      ]);
    }

    // Zatwierdzenie transakcji
    await client.query('COMMIT');
    client.release();

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Błąd zapisu zamówienia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Start serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

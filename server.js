// server.js — backend oparty na MongoDB
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'bulkreturns';
let db, orders;

async function connectDB() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  orders = db.collection('orders');
  console.log('Połączono z MongoDB');
}

app.post('/api/order', async (req, res) => {
  const { name, email, address, payment, cart } = req.body;

  if (!name || !email || !address || !payment || !Array.isArray(cart)) {
    return res.status(400).json({ message: 'Brakujące dane zamówienia' });
  }

  try {
    const order = {
      name,
      email,
      address,
      payment_method: payment,
      cart,
      created_at: new Date()
    };
    await orders.insertOne(order);
    res.json({ message: 'Zamówienie zapisane do MongoDB' });
  } catch (error) {
    console.error('Błąd przy zapisie zamówienia:', error);
    res.status(500).json({ message: 'Błąd serwera przy zapisie zamówienia' });
  }
});

connectDB().then(() => {
  app.listen(3000, () => {
    console.log('Serwer działa na http://localhost:3000');
  });
}).catch(err => {
  console.error('Nie udało się połączyć z MongoDB:', err);
});

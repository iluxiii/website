const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static('public'));

// Start server
app.listen(port, () => {
  console.log(`Shop running on port ${port}`);
});

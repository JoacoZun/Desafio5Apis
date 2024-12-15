const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'joyas',
  password: '1956', 
  port: 5432,
});

// Middleware para registro de consultas
app.use((req, res, next) => {
  console.log(`[INFO] Ruta consultada: ${req.method} ${req.url}`);
  next();
});

// Ruta GET /joyas
app.get('/joyas', async (req, res) => {
  try {
    const { limits, page, order_by } = req.query;

    // Configuración de paginación y ordenamiento
    const limit = parseInt(limits) || 10;
    const offset = ((parseInt(page) || 1) - 1) * limit;
    const order = order_by ? order_by.replace('_', ' ') : 'id ASC';

    const query = `SELECT * FROM inventario ORDER BY ${order} LIMIT $1 OFFSET $2;`;
    const { rows } = await pool.query(query, [limit, offset]);

    // Generar estructura HATEOAS
    const result = rows.map((row) => ({
      nombre: row.nombre,
      href: `http://localhost:${port}/joyas/${row.id}`,
    }));

    res.json({
      total: rows.length,
      joyas: result,
    });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud.' });
  }
});

// Ruta GET /joyas/filtros
app.get('/joyas/filtros', async (req, res) => {
  try {
    const { precio_max, precio_min, categoria, metal } = req.query;

    let filters = [];
    let values = [];

    if (precio_max) {
      filters.push('precio <= $' + (filters.length + 1));
      values.push(precio_max);
    }
    if (precio_min) {
      filters.push('precio >= $' + (filters.length + 1));
      values.push(precio_min);
    }
    if (categoria) {
      filters.push('categoria = $' + (filters.length + 1));
      values.push(categoria);
    }
    if (metal) {
      filters.push('metal = $' + (filters.length + 1));
      values.push(metal);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `SELECT * FROM inventario ${whereClause};`;

    const { rows } = await pool.query(query, values);

    res.json({
      total: rows.length,
      joyas: rows,
    });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud.' });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`API de joyas ejecutando en http://localhost:${port}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(bodyParser.json());

let db;
let booksCollection;

// Подключение к MongoDB
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db('booksdb');
    booksCollection = db.collection('books');
    app.listen(PORT, () => console.log(`Server started on ${PORT}`));
  })
  .catch(err => console.error('DB connection error:', err));

// Получить все книги
app.get('/api/books', async (req, res) => {
  res.json(await booksCollection.find().toArray());
});

// Получить книгу по id
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await booksCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!book) return res.status(404).json({ error: "not found" });
    res.json(book);
  } catch {
    res.status(400).json({ error: "invalid id" });
  }
});

// Добавить книгу
app.post('/api/books', async (req, res) => {
  const { title, author, year, genre } = req.body;
  if (!title || !author) return res.status(400).json({ error: "title and author required" });
  const newBook = { title, author, year: year || null, genre: genre || null };
  const result = await booksCollection.insertOne(newBook);
  res.status(201).json({ ...newBook, _id: result.insertedId });
});

// Обновить книгу по id
app.put('/api/books/:id', async (req, res) => {
  try {
    const { title, author, year, genre } = req.body;
    const updateRes = await booksCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, author, year, genre } }
    );
    if (updateRes.matchedCount === 0) return res.status(404).json({ error: "not found" });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "invalid id" });
  }
});

// Удалить книгу по id
app.delete('/api/books/:id', async (req, res) => {
  try {
    const delRes = await booksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (delRes.deletedCount === 0) return res.status(404).json({ error: "not found" });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "invalid id" });
  }
});


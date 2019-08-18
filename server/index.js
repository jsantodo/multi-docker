const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//Creamos una nueva aplicación Express que responderá peticiones HTTP
const app = express();

//Cross Origine Resource Sharing. Nos va a permitir hacer peticiones desde un dominio, 
//donde al aplicación React va a correr, a uno dominio diferente puerto, que es donde
//está alojado Express
app.use(cors());
//Esto convierte el body del request a json
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

//Creamos una tabla si no existe para añadir los indices
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
//Duplicamos la conexión para tener el publisher
const redisPublisher = redisClient.duplicate();

// Express route handlers. Son las rutas en las que nuestra aplicación va a responder
//dentro del Express Server
//si sólo ponemos el puerto (Creo)
app.get('/', (req, res) => {
  res.send('Hi');
});

//Devolverá todos los valores que hemos recibido desde que la aplicación está en marcha
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

//Devuelve todos los valores que hemos calculado y que hemos almacenado en Redis
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

//Recepción de nuevos valores desde la aplicación en React
app.post('/values', async (req, res) => {
  const index = req.body.index;

  //Por el coste de calcular un número fibonaccy muy alto, lo limitamos al 
  //valor 40 de la serie. Hay que recordar que es un cálculo recursivo
  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
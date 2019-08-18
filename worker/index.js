const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    //Esto se define en el keys.js
    host : keys.redisHost,
    port : keys.redisPort,
    //Si perdemos la conexión, lo reintentamos cada segundo
    retry_strategy: () => 1000
});
const sub = redisClient.duplicate();

//Esta es la función que hace los cálculos de series
function fib(index){
    if (index < 2) return 1;
    return fib(index-1) + fib(index-2);
}

//Esta función ejecuta cada vez que llega un mensaje a Redis. 
sub.on("message", (channel, message)=>{
    redisClient.hset('values', message, fib(parseInt(message)));
});

//Nos suscribimos a los eventos de inserción
sub.subscribe('insert');
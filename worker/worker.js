var amqp = require('amqplib/callback_api');
var async = require('async');

var statusExchange = 'rpc_status';
var service = 'opencpu';

function handleRequest(ch) {
  return function(msg) {
    var str = msg.content.toString();
    var taskId = msg.properties.correlationId;
    var replyTo = msg.properties.replyTo;
    console.log("Request received", replyTo, taskId);
    ch.publish('', replyTo, new Buffer(JSON.stringify({ "message": "Hello world"})), { contentType: 'application/json', correlationId: taskId });
    ch.ack(msg);
  };
}

async.waterfall([
  function(callback) {
    amqp.connect('amqp://' + process.env.PATAVI_BROKER_HOST, callback);
  },
  function(conn, callback) {
    conn.createChannel(callback);
  },
  function(ch, callback) {
    ch.assertExchange(statusExchange, 'topic', { durable: false }, function(err) {
      callback(err, ch);
    });
  },
  function(ch, callback) {
    ch.assertQueue(service, { exclusive: false, durable: true }, function(err) {
      callback(err, ch);
    });
  },
  function(ch, callback) {
    ch.consume(service, handleRequest(ch), { noAck: false }, callback);
  }
], function(err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
});

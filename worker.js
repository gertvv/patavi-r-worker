var amqp = require('amqplib/callback_api');
var async = require('async');
var http = require('http');

var statusExchange = 'rpc_status';
var service = 'nodejs';

function handleRequest(ch) {
  return function(msg) {
    const input = msg.content.toString();
    const taskId = msg.properties.correlationId;
    const replyTo = msg.properties.replyTo;
    console.log("Request received", replyTo, taskId);

    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        const content = Buffer.concat(chunks);
        const contentType = req.headers['content-type'];
        if (req.url === '/update') {
          if (contentType != "application/json") {
            console.log("/update only accepts JSON");
            return;
          }
          const json = JSON.parse(content);
          const routingKey = taskId + ".status";
          const evt = {
            taskId: taskId,
            eventType: "progress",
            eventData: json
          };
          ch.publish(statusExchange, routingKey, new Buffer(JSON.stringify(evt)), { contentType: contentType });
        } else if (req.url === '/result') {
          ch.publish('', replyTo, content, { contentType: contentType, correlationId: taskId });
          ch.ack(msg);
        } else {
          console.log("Unrecognized URL ", msg.url);
        }
      });
      res.end();
    });

    server.listen(8000, function(err) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      
      const exec = require('child_process').exec;

      const child = exec("R --vanilla --slave -f test.R", { timeout: 60 * 1000 }, function(error, stdout, stderr) {
        console.log(stdout);
        server.close();
      });
    });
    
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

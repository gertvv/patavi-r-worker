const http = require('http');
const progress = require('cli-progress');
const Busboy = require('busboy');
const tmp = require('tmp');
const fs = require('fs');

const pb = new progress.Bar();
pb.start(100, 0);

function streamToJson(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  stream.on('end', () => {
    const content = Buffer.concat(chunks);
    try {
      callback(null, JSON.parse(content));
    } catch (e) {
      callback(e);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/update') {
    if (req.headers['content-type'] === 'application/json') {
      streamToJson(req, function(err, json) {
        if (json.progress) {
          pb.update(json.progress);
        }
      });
      res.end();
    } else {
      res.status(415);
      res.end();
    }
  } else if (req.url === '/result') {
    const mp = "multipart/form-data";
    tmp.dir({ prefix: "patavi-" }, (err, path) => {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      if (req.headers['content-type'] === 'application/json') {
        var outFile = fs.createWriteStream(path + "/index.json");
        req.pipe(outFile).on('end', () => {
          pb.update(100);
          pb.stop();
          console.log("file://" + path);
        });
        res.end();
      } else if (req.headers['content-type'].substr(0, mp.length) === mp) {
        const busboy = new Busboy({ headers: req.headers });
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          var outFile = fs.createWriteStream(path + "/" + filename);
          file.pipe(outFile);
        });
        busboy.on('finish', function() {
          pb.update(100);
          pb.stop();
          console.log("file://" + path);
        });
        req.pipe(busboy);
        res.end();
      } else {
        res.status(415);
        res.end();
      }
    });
  } else {
    res.status(404);
    res.end();
  }
});

server.listen(8000);

const exec = require('child_process').exec;

const child = exec("R --vanilla --slave -f worker.R", { timeout: 60 * 1000 }, function(error, stdout, stderr) {
  console.log(stderr);
  server.close();
});
process.stdin.pipe(child.stdin);

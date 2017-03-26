Patavi R Worker
===============

[R](https://r-project.org/) worker for [Patavi](https://github.com/drugis/patavi) using NodeJS. Inspired by [OpenCPU](https://www.opencpu.org/), but taking an entirely different approach.

Running
-------

First, run `npm install` from the root directory. Then the following options are available:

 - `node worker` runs the Patavi worker. You must define the `PATAVI_BROKER_HOST` environment variable as a RabbitMQ connection string that includes credentials.
 - `node worker-cli` runs the worker without the dependency on Patavi. The workere will read input from standard in, show progress on standard out, and print the location of a temporary directory where results have been saved.

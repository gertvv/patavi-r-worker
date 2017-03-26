library(httr)
library(jsonlite)
library(evaluate)

source('extract.R')

cat("Running test.R")
srcFile <- file(normalizePath('test.R'))
setwd(tempdir())

input <- fromJSON(file("stdin"))

res <- POST("http://localhost:8000/update", body=list(progress=20), encode="json")
stopifnot(res$status_code == 200)

Sys.sleep(2)

res <- POST("http://localhost:8000/update", body=list(progress=90), encode="json")
stopifnot(res$status_code == 200)

env <- new.env()

handler <- new_output_handler()
handler <- new_output_handler(
  value=function(x, visible) {
    assign(".val", x, env)
    if (isTRUE(visible)) {
      print(x)
    }
    invisible()
  })

output <- evaluate(srcFile, envir=env, output_handler=handler)

cat(toJSON(env$.val), file="index.json")
cat(paste(extract(output, "console"), collapse="\n", sep=" "), file="console.txt")
cat(paste(extract(output, "source"), collapse="", sep=" "), file="script.R")

res <- POST("http://localhost:8000/result", body=list(index=upload_file("index.json", "application/json"), plot.png=upload_file("plot.png", "image/png"), console=upload_file("console.txt", "text/plain"), script=upload_file("script.R")), encode="multipart")
stopifnot(res$status_code == 200)

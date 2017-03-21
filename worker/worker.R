library(httr)
library(jsonlite)
library(evaluate)

cat("Running test.R")
setwd(tempdir())

input <- fromJSON(file("stdin"))

res <- POST("http://localhost:8000/update", body=list(progress=20), encode="json")
stopifnot(res$status_code == 200)

Sys.sleep(2)

res <- POST("http://localhost:8000/update", body=list(progress=90), encode="json")
stopifnot(res$status_code == 200)

env <- new.env()
output <- list()

handler <- new_output_handler()
handler <- new_output_handler(value=function(x, visible) { output$value <<- x }, source=function(x) { output$text <<- c(output$text, list(x$src)) }, text=function(x) { output$text <<- c(output$text, list(x)) })

test <- evaluate('
  x <- rnorm(input$n)
  png("plot.png")
  hist(x)
  dev.off()
  result <- list(x=x)
', envir=env, output_handler=handler)

cat(toJSON(output$value), file="index.json")
cat(paste(output$text, collapse="\n"), file="stdout.txt")

res <- POST("http://localhost:8000/result", body=list(index=upload_file("index.json", "application/json"), plot.png=upload_file("plot.png", "image/png"), stdout=upload_file("stdout.txt", "text/plain")), encode="multipart")
stopifnot(res$status_code == 200)

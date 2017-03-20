library(httr)
library(jsonlite)

cat("Running test.R")

res <- POST("http://localhost:8000/update", body=list(progress=20), encode="json")
stopifnot(res$status_code == 200)

Sys.sleep(2)

res <- POST("http://localhost:8000/update", body=list(progress=90), encode="json")
stopifnot(res$status_code == 200)

x <- rnorm(50)

png(paste0("plot.png"))
hist(x)
dev.off()

result <- list(x = x)
cat(toJSON(result), file="index.json")

res <- POST("http://localhost:8000/result", body=list(index=upload_file("index.json", "application/json"), plot.png=upload_file("plot.png", "image/png")), encode="multipart")
stopifnot(res$status_code == 200)

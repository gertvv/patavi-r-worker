x <- rnorm(input$n)
x
print(x)
png("plot.png")
hist(x)
dev.off()
stop("Test")
result <- list(x=x)

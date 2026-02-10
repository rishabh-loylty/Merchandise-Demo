<!-- Creating Postgres Database in Docker -->
docker run -d \
  --name postgres-merchandise \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=merchandise \
  -p 5432:5432 \
  postgres:16

<!-- Stop / restart later (when needed) -->
docker stop postgres-merchandise
docker start postgres-merchandise

<!-- Delete everything (if you want a fresh start) -->
docker rm -f postgres-merchandise

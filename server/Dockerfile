FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Wait for postgres, run seed, then start
CMD ["sh", "-c", "sleep 5 && node db/seed.js; node index.js"]

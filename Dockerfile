# Menggunakan Node.js versi 22 berbasis Alpine
FROM node:22-alpine

# Menentukan direktori kerja dalam container
WORKDIR /app/choice-be

# Menyalin file package.json dan package-lock.json
COPY package*.json ./

# Menginstal dependensi
RUN npm install

# Menyalin seluruh file proyek ke dalam container
COPY . .

# Ekspos port backend (misalnya 3000)
EXPOSE 3000

# Menjalankan development server
CMD ["npm", "run", "dev"]

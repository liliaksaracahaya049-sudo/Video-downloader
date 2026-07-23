FROM node:20-slim

RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip curl unzip && \
    pip3 install --break-system-packages "yt-dlp[default,curl-cffi]" && \
    curl -fsSL https://deno.land/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]

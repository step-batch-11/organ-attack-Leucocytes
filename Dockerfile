FROM denoland/deno:2.7.5

COPY . .

RUN deno install

CMD ["deno", "run","-A", "main.js"]
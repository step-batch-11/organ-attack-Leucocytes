FROM denoland/deno:2.2.11
COPY . .
RUN deno install
CMD ["deno", "run","-A", "main.js"]
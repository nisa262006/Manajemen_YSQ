// Simple static file server using Bun
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    // Default route ke login.html
    if (filePath === '/') {
      filePath = '/login.html';
    }

    // Baca file dari filesystem
    try {
      const file = Bun.file(`.${filePath}`);

      // Cek apakah file exists
      if (await file.exists()) {
        return new Response(file);
      }

      // File tidak ditemukan
      return new Response('404 - File Not Found', { status: 404 });
    } catch (error) {
      return new Response('500 - Internal Server Error', { status: 500 });
    }
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📝 Open http://localhost:${server.port} to view the login page`);

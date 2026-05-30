const bcrypt = require('bcrypt');

const hash = '$2a$12$a8YvFLJ3dhQJaPCdHgeY7Og62137S9KOqbImtWBMipqCzaIf3VRM.';
console.log('is admin123 match?', bcrypt.compareSync('admin123', hash));
console.log('is admin1 match?', bcrypt.compareSync('admin1', hash));

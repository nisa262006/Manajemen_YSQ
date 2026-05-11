const bcrypt = require('bcrypt');

const hash2 = '$2a$12$cNMExvVowAI/Xbg5OkPyoO.9wrsDV0.MrsJxPbN2WJP0k0JuMD6/q';

bcrypt.compare('admin2', hash2).then(res => {
    console.log('Is hash for admin2?', res);
});

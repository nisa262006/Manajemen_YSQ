const bcrypt = require("bcrypt");

const daftarNama = [
"Aafiyah",
"Adiva Azalea",
"Andu Izaz Rahensyah",
"Insyira Fauzia",
"M Zaid Abdurahman",
"Nabila Adelia Reva",
"Nayla Calysta Irwanto",
"Raina Dwi Maheswari",
"Ammar Yazid",
"Arsyad Taqiya Algham",
"Daffa Pratama",
"Inara Syu'la Hanunnah",
"Keinandra Rafif Athariz",
"M Bilal Ramadhan",
"Shofiyyah",
"Viola Vilonia Zayyan",
"Aahga Haneef Alfarizi",
"Al Farabi Farzan",
"Alesha",
"Alviano",
"Athallah Arshad Abhinayya",
"Baruna",
"Langit Arshaka Rafif",
"M Afdhal Sholah",
"M Aktar Rifki",
"M Faqih Azzami",
"Muhammad Afnan Nafi",
"Nizayn Adzriel",
"Siti Nur Afifah",
"Sulaiman Husein Al Latif",
"Utsmani 1",
"Alya Shakila Azzahra",
"Ammar Al Fariq",
"Anindita F.A",
"Anindya",
"Aqil",
"Arsyila Humaira Qaireen",
"Carissa Zahra Putri",
"Elfahreza Ankarian Halim",
"Fildza Safa Mufidah",
"Kimimela Ajeng Inara",
"M Akhtar Al Faith",
"M Altair",
"Mahiske Nuke Anandhita",
"Muhammad Al Ayyubi",
"Nadine Azzahra",
"Nida Aida Zahra",
"Nizam M Hafiz",
"Onad",
"Rafasya Hamizan Turnadi",
"Ruqoya Surayya",
"Teuku Muhammad Raffi",
"Uwais Al Fajri",
"Abdiel Belva Nugraha",
"Dannis Naratungga",
"Devita N",
"Faith Suja Athallah",
"Falih Hafuza",
"Fatiyya Hasna Izzati",
"Freya Nafia Zuhayra",
"Kenzo Rasya Aditya",
"Lativa Adelia",
"M Arya Zuhdi",
"M Fahrezi Hasan",
"M Kenzie",
"M Nathan Zulfikar",
"M RamdhaniAl Rizky",
"M Rasydan",
"Maysya Putri Artanti",
"Nadia Yasmin Kurniawan",
"Nizam Nurfadhi Istiyarto",
"Safaraz Naufal Ghani",
"Shaquile Davina Haryoko",
"Syafia Adia A",
"Umamah Hanun Muthmainnah"
];

(async () => {
  console.log("INSERT INTO users (email, password_hash, role, username) VALUES");

  for (let i = 0; i < daftarNama.length; i++) {
    const nama = daftarNama[i];

    const username = nama
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w]/g, ""); // hapus tanda petik, titik, dll

    const password = username + "123";
    const hash = await bcrypt.hash(password, 10);

    const koma = i === daftarNama.length - 1 ? "" : ",";
    console.log(
      `(NULL, '${hash}', 'santri', '${username}')${koma}`
    );
  }

  console.log("ON CONFLICT (username) DO NOTHING;");
  process.exit();
})();

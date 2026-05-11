/**
 * globalTeardown.js - dijalankan SEKALI setelah seluruh test suite selesai
 * Menutup pool koneksi DB agar tidak ada open handles.
 * 
 * NOTE: globalTeardown berjalan di proses terpisah dari test workers.
 * Jadi pool yang ditutup di sini adalah instance baru, bukan yang dipakai tests.
 * --forceExit di package.json menangani cleanup di test workers.
 */
module.exports = async () => {
  // Pool cleanup is handled by --forceExit flag in jest config
  // This file exists as a safety net
  console.log('✅ globalTeardown executed');
};

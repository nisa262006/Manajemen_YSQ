// ====================================================================
// 1. KELAS UTAMA: UIManager (Manajemen Konten dan Navigasi) - MODIFIKASI
// ====================================================================
class UIManager {
    constructor() {
        this.menuItems = document.querySelectorAll('.menu-item');
        this.logoutButton = document.querySelector('.footer-btn.logout');
        this.mainContent = document.querySelector('.main-content');
        this.notificationToast = document.getElementById('notification-toast');
        
        this.initialDashboardHTML = this.mainContent ? this.mainContent.innerHTML : ''; 
        
        // --- PROPERTI BARU UNTUK EDIT DETAIL ---
        this.currentPengajarId = null; 

        this.initMenuNavigation();
        this.initQuickActions();
        this.initTableActions(); 
        this.initLogout();
    }
    
    // --- UTILITY: NOTIFIKASI ---
    showNotification(message, type = 'success') { 
        if (!this.notificationToast) return;
        this.notificationToast.textContent = message;
        this.notificationToast.className = `toast-notification show ${type}`;
        setTimeout(() => {
            this.notificationToast.classList.remove('show');
            setTimeout(() => { this.notificationToast.className = 'toast-notification'; }, 300); 
        }, 1500); 
    }

    // **********************************************
    // * FUNGSI PLACEHOLDER DATABASE (ASYNC) *
    // **********************************************
    async saveDataToDatabase(idPengajar, data) {
        console.log(`[DATABASE SIMULASI] Menyimpan data untuk Pengajar ID: ${idPengajar}`);
        console.log("Data yang dikirim:", data);
        
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        if (data && data.action === 'delete') {
            return true; 
        }
        return true; 
    }

    // **********************************************
    // * FUNGSI BARU: Logic Toggle Status (Tabel) *
    // **********************************************
    togglePengajarStatus(element, newStatus) {
        const row = element.closest('tr');
        const idPengajar = row ? row.getAttribute('data-id') : 'UNKNOWN';

        let text;
        let className;

        if (newStatus === 'aktif') {
            text = 'Aktif';
            className = 'status-accepted'; 
            this.showNotification(`Pengajar ID ${idPengajar} diaktifkan.`, 'success');
        } else {
            text = 'Tidak Aktif';
            className = 'status-rejected'; 
            this.showNotification(`Pengajar ID ${idPengajar} dinonaktifkan.`, 'cancel');
        }

        element.textContent = text;
        element.setAttribute('data-status', newStatus);
        
        element.classList.remove('status-accepted', 'status-rejected');
        element.classList.add(className);
        
        console.log(`[STATUS TOGGLE] Pengajar ${idPengajar} diubah menjadi: ${newStatus}`);
    }

    // **********************************************
    // * FUNGSI BARU: Update Status di Tabel Utama *
    // **********************************************
    updatePengajarRowStatus(id, newStatus) {
        const row = document.querySelector(`#pengajar-list-table tr[data-id="${id}"]`);
        if (!row) {
            console.error(`Baris pengajar dengan ID ${id} tidak ditemukan di tabel.`);
            return;
        }

        const statusElement = row.querySelector('.status-toggle');
        if (!statusElement) {
            console.error(`Elemen status toggle tidak ditemukan di baris ID ${id}.`);
            return;
        }

        const statusText = newStatus === 'aktif' ? 'Aktif' : 'Tidak Aktif';
        const statusClass = newStatus === 'aktif' ? 'status-accepted' : 'status-rejected';

        statusElement.textContent = statusText;
        statusElement.setAttribute('data-status', newStatus);
        statusElement.classList.remove('status-accepted', 'status-rejected');
        statusElement.classList.add(statusClass);
    }

    // **********************************************
    // * FUNGSI BARU: Inisialisasi Logika Edit/Simpan Detail Pengajar *
    // **********************************************
    initDetailEditActions() {
        const editButton = document.getElementById('btn-edit-mode');
        const saveButton = document.getElementById('btn-save-mode');
        const cancelButton = document.getElementById('btn-cancel-mode');
        const deleteAccountButton = document.getElementById('btn-hapus-akun-detail'); // Tombol Hapus Akun
        const viewAbsensiButton = document.getElementById('btn-lihat-absensi'); // Tombol Riwayat Absensi

        const formFields = document.querySelectorAll('#form-detail-pengajar .profile-input');
        const statusDisplayInput = document.getElementById('input-status-display');

        // --- Custom Modal Elements ---
        const modal = document.getElementById('delete-confirm-modal');
        const modalPengajarId = document.getElementById('modal-pengajar-id');
        const modalBtnDelete = document.getElementById('modal-btn-delete');
        const modalBtnCancel = document.getElementById('modal-btn-cancel');
        // -----------------------------
        
        if (!editButton) return; 

        let initialValues = {};
        
        const captureInitialValues = () => {
            formFields.forEach(field => {
                initialValues[field.id] = field.value;
            });
        };

        const setEditMode = (isEdit) => {
            if (isEdit) {
                // ---- MASUK KE MODE EDIT ----
                captureInitialValues(); 

                formFields.forEach(field => {
                    if (field.id !== 'input-nim-nip' && field.id !== 'input-terdaftar' && field.id !== 'input-status-display') {
                        field.disabled = false;
                        field.style.backgroundColor = '#fff'; 
                    }
                });
                
                editButton.style.display = 'none';
                saveButton.style.display = 'inline-block';
                cancelButton.style.display = 'inline-block';
            } else {
                // ---- KEMBALI KE MODE LIHAT (Disabled) ----
                formFields.forEach(field => {
                    field.disabled = true;
                    field.style.backgroundColor = '#f7f7f7'; 
                });
                
                // Pastikan status display tetap berwarna
                if(statusDisplayInput) {
                    statusDisplayInput.style.backgroundColor = statusDisplayInput.value === 'Aktif' ? '#4CAF50' : '#f44336';
                    statusDisplayInput.style.color = 'white';
                }

                editButton.style.display = 'inline-block';
                saveButton.style.display = 'none';
                cancelButton.style.display = 'none';
            }
        };
        
        // Pasang Handler Tombol Edit
        editButton.addEventListener('click', () => setEditMode(true));
        
        // HANDLER SIMPAN (DATA PERSONAL)
        saveButton.addEventListener('click', async (e) => { 
            e.preventDefault();
            
            const pengajarId = this.currentPengajarId;
            
            const updatedData = {
                // Ambil semua field yang bisa diubah:
                nama: document.getElementById('input-nama').value,
                alamat: document.getElementById('input-alamat').value,
                tglLahir: document.getElementById('input-tgl-lahir').value,
                telepon: document.getElementById('input-telepon').value,
                kelas: document.getElementById('input-kelas').value,
                role: document.getElementById('input-role').value,
                username: document.getElementById('input-username').value,
                email: document.getElementById('input-email').value,
            };

            const success = await this.saveDataToDatabase(pengajarId, updatedData);

            if (success) {
                this.showNotification("Data berhasil disimpan!", 'success');
                setEditMode(false);
            } else {
                this.showNotification("Gagal menyimpan data ke server.", 'cancel');
            }
        });

        // Handler Batal
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            formFields.forEach(field => {
                if (initialValues.hasOwnProperty(field.id)) {
                    field.value = initialValues[field.id];
                }
            });
            
            setEditMode(false);
            this.showNotification("Perubahan dibatalkan.", 'cancel');
        });
        
        // =========================================================================
        // HANDLER HAPUS AKUN (CUSTOM MODAL)
        // =========================================================================
        if (deleteAccountButton && modal) {
            deleteAccountButton.addEventListener('click', (e) => {
                e.preventDefault();
                const pengajarId = this.currentPengajarId;
                
                // Suntikkan ID dan tampilkan modal
                if (modalPengajarId) {
                    modalPengajarId.textContent = pengajarId;
                }
                modal.style.display = 'block';
            });
        }
        
        // Tombol BATAL di Modal
        if (modalBtnCancel && modal) {
            modalBtnCancel.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }
        
        // Tombol HAPUS PERMANEN di Modal (Memproses Penghapusan)
        if (modalBtnDelete && modal) {
            modalBtnDelete.addEventListener('click', async () => {
                if (modal) modal.style.display = 'none'; 
                
                const pengajarId = this.currentPengajarId;
                const success = await this.saveDataToDatabase(pengajarId, { action: 'delete' });

                if (success) {
                    this.showNotification(`Akun ID ${pengajarId} berhasil dihapus.`, 'success');
                    
                    // Hapus baris dari tabel utama (untuk visual)
                    const rowToDelete = document.querySelector(`#pengajar-list-table tr[data-id="${pengajarId}"]`);
                    if (rowToDelete) {
                        rowToDelete.remove();
                    }
                    
                    // Kembali ke daftar pengajar
                    const pengajarMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Pengajar');
                    if (pengajarMenuItem) {
                        pengajarMenuItem.click();
                    } else {
                        this.loadDashboardContent();
                    }
                    
                } else {
                    this.showNotification("Gagal menghapus akun di server.", 'cancel');
                }
            });
        }
        
        // Listener untuk menutup modal saat mengklik di luar area
        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // 2. Handler Riwayat Absensi
        if (viewAbsensiButton) {
            viewAbsensiButton.addEventListener('click', () => {
                const pengajarId = this.currentPengajarId;
                this.showNotification(`Mengarahkan ke Riwayat Absensi Pengajar ID ${pengajarId} (Fungsi navigasi perlu diimplementasikan).`, 'info');
            });
        }

        setEditMode(false); 
    }
    
    // --- ROUTING/CONTENT MANAGEMENT ---
    
    loadDashboardContent() {
        if (this.mainContent && this.initialDashboardHTML) {
            this.mainContent.innerHTML = this.initialDashboardHTML;
            
            this.initQuickActions(); 
            this.initTableActions(); 
            
            // Pastikan 'Dashboard' aktif saat memuat Dashboard
            this.menuItems.forEach(i => i.classList.remove('active'));
            const dashboardItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Dashboard');
            if (dashboardItem) {
                dashboardItem.classList.add('active');
            }
            
            this.initMenuNavigation(); 
            document.dispatchEvent(new CustomEvent('reInitProfileManager')); 
            
            console.log("[CONTENT] Konten Dashboard dimuat ulang.");
        }
    }
    
    // **********************************************
    // * FUNGSI BARU: Load Konten Daftar Kelas Santri *
    // **********************************************
    async loadDaftarKelasSantriContent() {
        // Panggil loadContent untuk memuat daftar_kelas_santri.html dan mengaktifkan sidebar 'Daftar Kelas'
        this.loadContent('Daftar Kelas', 'daftar_kelas_santri.html'); 
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: Muat Konten Tambah Kelas *
    // **********************************************
    async loadTambahKelasContent() {
        if (!this.mainContent) return;

        try {
            const targetFilename = 'tambah_kelas.html'; 
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat halaman Tambah Kelas. Pastikan file ${targetFilename} tersedia.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            // Inisialisasi aksi-aksi di halaman tersebut
            this.initTambahKelasActions(); 
            this.initBackButton('Dashboard'); // Tambahkan listener untuk tombol kembali

            // -----------------------------------------------------------------
            // !!! MODIFIKASI INI HANYA MENGAKTIFKAN DASHBOARD DI SIDEBAR !!!
            this.menuItems.forEach(i => i.classList.remove('active'));
            const dashboardItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Dashboard');
            if (dashboardItem) {
                dashboardItem.classList.add('active'); 
            }
            // -----------------------------------------------------------------
            
            document.dispatchEvent(new CustomEvent('reInitProfileManager')); 
            console.log("[CONTENT] Konten Tambah Kelas berhasil dimuat. Menu Sidebar: Dashboard (Aktif).");

        } catch (error) {
            console.error(`[ERROR ROUTING Tambah Kelas]`, error);
        }
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: Inisialisasi Aksi di Halaman Tambah Kelas *
    // **********************************************
    initTambahKelasActions() {
        const btnTambahKelas = document.getElementById('btn-tambah-kelas');
        const kelasTingkatanSelect = document.getElementById('kelas-tingkatan');

        // 1. Tangani klik tombol "Tambah Kelas" di bagian aksi cepat (MEMICU MODAL)
        if (btnTambahKelas) {
            const newBtn = btnTambahKelas.cloneNode(true);
            btnTambahKelas.replaceWith(newBtn);
            
            newBtn.addEventListener('click', () => {
                const selectedTingkatan = kelasTingkatanSelect ? kelasTingkatanSelect.options[kelasTingkatanSelect.selectedIndex].text : 'Kelas Baru';
                this.showKelasModal(selectedTingkatan);
            });
        }
        
        // 2. Tangani ikon Aksi (+) di dalam Tabel (NAVIGASI KE DAFTAR KELAS SANTRI)
        const tableBody = document.getElementById('kelas-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const row = target.closest('.table-data-row');
                const kelasNama = row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'Kelas Baru';
                
                // Ikon Tambah (+) di tabel -> NAVIGASI KE DAFTAR KELAS SANTRI
                if (target.classList.contains('btn-add-pengajar')) {
                    console.log(`[AKSI TABEL] Navigasi ke Daftar Kelas Santri dari kelas: ${kelasNama}`);
                    
                    // *** PENTING: Panggil fungsi navigasi ke Daftar Kelas Santri ***
                    this.loadDaftarKelasSantriContent();
                } 
                // Ikon Hapus
                else if (target.classList.contains('btn-delete-kelas')) {
                    if (confirm(`Anda yakin ingin menghapus kelas: ${kelasNama}?`)) {
                        row.remove(); // Hapus baris dari DOM (simulasi)
                        this.showNotification(`Kelas ${kelasNama} berhasil dihapus (simulasi).`, 'cancel');
                    }
                }
            });
        }
        
        // 3. Inisialisasi Aksi Modal
        this.initKelasModalActions();

        // 4. Rebind tombol Kembali
        this.initBackButton('Dashboard'); 
    }

    // **********************************************
    // * FUNGSI BARU: showKelasModal (DIPERTAHANKAN) *
    // **********************************************
    showKelasModal(kelasNama = 'Kelas Baru') {
        const modal = document.getElementById('tambah-kelas-modal');
        const kelasInput = document.getElementById('kelas-tingkatan-popup');

        if (!modal) {
            console.error('Elemen modal dengan ID "tambah-kelas-modal" tidak ditemukan.');
            return;
        }
        
        // Set nilai input Kelas/Tingkatan di modal
        if (kelasInput) kelasInput.value = (kelasNama === '-- Pilih Tingkatan --') ? '' : kelasNama;
        
        // Bersihkan input lain jika diperlukan (optional)
        document.getElementById('pengajar-popup').value = '';
        document.getElementById('kapasitas-popup').value = '';
        document.getElementById('kategori-popup').value = '';
        document.getElementById('waktu-awal-popup').value = '';
        document.getElementById('waktu-selesai-popup').value = '';
        
        // Tampilkan modal
        modal.style.display = 'flex';
        console.log(`[MODAL] Modal Tambah Kelas ditampilkan.`);
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: initKelasModalActions *
    // **********************************************
    initKelasModalActions() {
        const modal = document.getElementById('tambah-kelas-modal');
        if (!modal) return;
        
        const closeBtn = document.getElementById('close-kelas-modal');
        const batalBtn = document.getElementById('btn-batal-kelas-modal');
        const form = document.getElementById('form-tambah-kelas');

        const closeModal = () => modal.style.display = 'none';

        // 1. Tombol Close (X) di pojok (REBIND + HANYA MENUTUP MODAL)
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.replaceWith(newCloseBtn);
            newCloseBtn.addEventListener('click', () => {
                 closeModal();
                 // TIDAK ADA TOAST
            });
        }
        
        // 2. Tombol Batalkan di bawah (REBIND + LOGIKA TOAST)
        if (batalBtn) {
            const newBatalBtn = batalBtn.cloneNode(true);
            batalBtn.replaceWith(newBatalBtn);
            
            newBatalBtn.addEventListener('click', () => {
                closeModal();
                // TOAST DIMUNCULKAN DI SINI
                this.showNotification('Pengisian dibatalkan.', 'cancel'); 
            });
        }
        
        // 3. Listener untuk Simpan (REBIND)
        if (form) {
            const newForm = form.cloneNode(true);
            form.replaceWith(newForm);
            
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Dapatkan data form
                const data = {
                    tingkatan: document.getElementById('kelas-tingkatan-popup').value,
                    pengajar: document.getElementById('pengajar-popup').value,
                    kapasitas: document.getElementById('kapasitas-popup').value,
                    kategori: document.getElementById('kategori-popup').value,
                    waktuAwal: document.getElementById('waktu-awal-popup').value,
                    waktuSelesai: document.getElementById('waktu-selesai-popup').value,
                };

                // Lakukan validasi minimal
                if (!data.tingkatan || !data.pengajar) {
                    this.showNotification('Kelas/Tingkatan dan Pengajar wajib diisi.', 'cancel');
                    return;
                }

                // Simulasi pengiriman data
                const success = await this.saveDataToDatabase(null, { action: 'add_class', data });
                
                if (success) {
                    this.showNotification(`Kelas ${data.tingkatan} berhasil disimpan!`, 'success');
                } else {
                     this.showNotification(`Gagal menyimpan kelas.`, 'cancel');
                }
                
                closeModal();
            });
        }
        
        // 4. Tutup modal jika klik di luar area konten (HANYA MENUTUP MODAL)
        if (!modal.dataset.listenerAdded) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
            modal.dataset.listenerAdded = 'true';
        }
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: INIT TOMBOL KEMBALI *
    // **********************************************
    initBackButton(previousPageTitle = 'Dashboard') {
        const backButton = document.querySelector('#back-to-dashboard');
        if (backButton) {
            const newBackButton = backButton.cloneNode(true);
            backButton.replaceWith(newBackButton); 
            
            newBackButton.addEventListener('click', () => {
                this.menuItems.forEach(i => i.classList.remove('active'));

                if (previousPageTitle === 'Daftar Pengajar') {
                    const pengajarMenuItem = Array.from(this.menuItems).find(item => 
                        item.textContent.trim() === 'Daftar Pengajar'
                    );
                    if (pengajarMenuItem) {
                        pengajarMenuItem.classList.add('active');
                        this.loadContent('Daftar Pengajar', 'daftar_pengajar.html');
                    } else {
                        this.loadDashboardContent(); // Default ke Dashboard
                    }
                } else {
                    this.loadDashboardContent(); // Kembali ke Dashboard
                }
            });
        }
    }
    
    // **********************************************
    // * FUNGSI MODIFIKASI: MUAT KONTEN DETAIL PENGAJAR *
    // **********************************************
    async loadDetailPengajarContent(idPengajar) {
        if (!this.mainContent) return;

        this.currentPengajarId = idPengajar; 
        
        // 1. Ekstrak Status saat ini dari Tabel (DOM)
        const row = document.querySelector(`#pengajar-list-table tr[data-id="${idPengajar}"]`);
        let currentStatusText = 'Aktif'; 
        let statusColor = '#4CAF50'; 
        
        if (row) {
            const statusToggleElement = row.querySelector('.status-toggle');
            if (statusToggleElement) {
                currentStatusText = statusToggleElement.textContent.trim();
                if (currentStatusText === 'Tidak Aktif') {
                    statusColor = '#f44336'; 
                }
            }
        }

        try {
            const targetFilename = 'detail_pengajar.html'; 
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat detail pengajar.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            this.initBackButton('Daftar Pengajar');
            
            // 2. Suntikkan Status ke input display di halaman detail
            const statusDisplayInput = document.getElementById('input-status-display');
            if(statusDisplayInput) {
                statusDisplayInput.value = currentStatusText;
                statusDisplayInput.style.backgroundColor = statusColor;
                statusDisplayInput.style.color = 'white';
            }


            // 3. Panggil inisialisasi Edit/Simpan
            this.initDetailEditActions(); 
            
            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            
            console.log(`[CONTENT] Konten Detail Pengajar (ID: ${idPengajar}) berhasil dimuat.`);

        } catch (error) {
            console.error(`[ERROR ROUTING Detail Pengajar]`, error);
        }
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: loadContent *
    // **********************************************
    async loadContent(pageTitle, filename, data = null) {
        if (!this.mainContent) return;

        try {
            let htmlContent;
            let targetFilename = filename;

            // Menentukan file yang akan di-fetch
            if (pageTitle === 'Tambah Siswa') {
                targetFilename = 'tambah_siswa.html';
            } else if (pageTitle === 'Tambah Pengajar') {
                targetFilename = 'tambah_pengajar.html'; 
            } else if (pageTitle === 'Daftar Pengajar') { 
                targetFilename = 'daftar_pengajar.html'; 
            } else if (pageTitle === 'Daftar Kelas') {
                // KOREKSI NAMA FILE: daftar_kelas_santri.html
                targetFilename = 'daftar_kelas_santri.html';
            }
            
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                htmlContent = `
                    <header class="dashboard-header">
                        <h1 class="header-title" id="page-content-title">${pageTitle}</h1>
                        <div class="admin-profile">
                            <span class="admin-text">Admin</span>
                            <i class="fas fa-user-circle admin-icon"></i>
                        </div>
                    </header>
                    <div style="padding: 20px; background: white; border-radius: 10px;">
                        <h2>${pageTitle}</h2>
                        <p>Error: File **${targetFilename}** tidak ditemukan atau gagal dimuat.</p>
                    </div>
                    <button id="back-to-dashboard" class="action-btn back-btn" style="margin-top: 20px;">
                        <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
                    </button>
                `;
            } else {
                htmlContent = await response.text();
            }

            this.mainContent.innerHTML = htmlContent;

            this.initBackButton('Dashboard'); 
            
            // PENTING: Aktivasi Sidebar dilakukan di sini, karena konten baru sudah dimuat
            const targetMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === pageTitle);
            this.menuItems.forEach(i => i.classList.remove('active'));
            if (targetMenuItem) {
                targetMenuItem.classList.add('active');
            }

            if (pageTitle === 'Daftar Pengajar') { 
                this.initTableActions(); 
            } else if (pageTitle === 'Daftar Kelas') {
                // Panggil inisialisasi aksi untuk Daftar Kelas Santri setelah konten dimuat
                this.initDaftarKelasSantriActions();
            } else if (pageTitle === 'Tambah Siswa') {
                this.initContentStatusActions();
            } else if (pageTitle === 'Tambah Pengajar') {
                this.initQuickActions(); 
            }

            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            
        } catch (error) {
            console.error(`[ERROR ROUTING]`, error);
        }
    }
    
    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi di Halaman Daftar Kelas Santri *
    // **********************************************
    initDaftarKelasSantriActions() {
        // 1. Logika Tab Filter
        const tabs = document.querySelectorAll('.class-filter-tabs .tab');
        const tableBody = document.getElementById('santri-kelas-table-body');
        // Pastikan tabel body ada sebelum mencoba query rows
        const rows = tableBody ? tableBody.querySelectorAll('.table-data-row') : [];
        
        if (tabs.length > 0) {
            const applyFilter = (filter) => {
                 // 1. Update active class pada tabs
                 document.querySelectorAll('.class-filter-tabs .tab').forEach(t => {
                     t.classList.remove('active');
                     // Hapus garis tebal (indicator)
                     const existingLine = t.querySelector('div');
                     if (existingLine) existingLine.remove();
                     t.style.fontWeight = 'normal';
                     t.style.color = '#888';
                 });
                 
                 const activeTab = document.querySelector(`.class-filter-tabs .tab[data-filter="${filter}"]`);
                 if (activeTab) {
                     activeTab.classList.add('active');
                     activeTab.style.fontWeight = '600';
                     activeTab.style.color = '#115533';
                     
                     // Tambahkan garis tebal (indicator) ke tab yang aktif
                     const activeLine = document.createElement('div');
                     activeLine.style.cssText = `
                         position: absolute;
                         bottom: -6px; 
                         left: 0;
                         width: 100%;
                         height: 3px;
                         background-color: #115533; 
                         z-index: 10;
                     `;
                     activeTab.appendChild(activeLine);
                 }


                 // 2. Simulasi Pemfilteran Data
                 console.log(`[FILTER] Mengubah filter kelas menjadi: ${filter}`);
                 this.showNotification(`Menampilkan data filter: ${filter.toUpperCase()}`, 'info');
                 
                 // --- Logika Filter Sederhana ---
                 rows.forEach(row => {
                     // Ambil status dari kolom Status ke-7
                     const statusCell = row.querySelector('td:nth-child(7)');
                     const statusKelas = statusCell ? statusCell.textContent.trim() : '';

                     let display = true;

                     if (filter === 'belum-ada-kelas') {
                         if (statusKelas !== 'Menunggu' && statusKelas !== 'Belum Ada') {
                             display = false;
                         }
                     } else if (filter === 'sudah-ada-kelas') {
                         if (statusKelas === 'Menunggu' || statusKelas === 'Belum Ada') {
                              display = false;
                         }
                     } 
                     // Filter 'semua' menampilkan semua
                     row.style.display = display ? '' : 'none';
                 });
                 // --------------------------------
            }


            tabs.forEach(tab => {
                // Rebind listener untuk tab filter
                const newTab = tab.cloneNode(true);
                tab.replaceWith(newTab);

                newTab.addEventListener('click', (e) => {
                    const filter = e.target.getAttribute('data-filter');
                    applyFilter(filter);
                });
                
                // Panggil applyFilter saat inisialisasi jika tab ini aktif (untuk menggambar garis)
                if (newTab.classList.contains('active')) {
                    applyFilter(newTab.getAttribute('data-filter'));
                }
            });
        }

        // 2. Inisialisasi tombol Simpan di halaman Daftar Kelas Santri
        const saveAllBtn = document.querySelector('.save-class-changes-btn');
        if (saveAllBtn) {
            const newBtn = saveAllBtn.cloneNode(true);
            saveAllBtn.replaceWith(newBtn);
            newBtn.addEventListener('click', () => {
                 this.showNotification("Simulasi: Perubahan kelas santri berhasil disimpan.", 'success');
            });
        }
        
        this.initBackButton('Dashboard'); 
    }


    // --- LISTENER INITIALIZATION ---

    // **********************************************
    // * FUNGSI MODIFIKASI: initMenuNavigation *
    // **********************************************
    initMenuNavigation() {
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Hanya hapus kelas active, tapi jangan segera tambahkan kelas active di sini
                // Karena loadContent akan menanganinya
                this.menuItems.forEach(i => i.classList.remove('active'));
                // item.classList.add('active'); // Dihapus sementara
                
                const menuText = item.textContent.trim();
                let filename = `${menuText.toLowerCase().replace(/\s/g, '_')}.html`;

                if (menuText === 'Dashboard') {
                    this.loadDashboardContent();
                } else if (menuText === 'Daftar Kelas') { 
                    // Menggunakan loadContent untuk memastikan sidebar aktif dan nama file baru dimuat
                    this.loadContent(menuText, 'daftar_kelas_santri.html');
                } else if (!menuText.includes('Setting') && !menuText.includes('Keluar')) {
                    
                    if (menuText === 'Daftar Pengajar') {
                        filename = 'daftar_pengajar.html';
                    }
                    this.loadContent(menuText, filename);
                }
            });
        });
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: initQuickActions *
    // **********************************************
    initQuickActions() {
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.replaceWith(newBtn);
            
            const btnText = newBtn.textContent.trim();

            if (btnText.includes('Tambah Siswa')) {
                newBtn.addEventListener('click', () => {
                    this.loadContent('Tambah Siswa', 'tambah_siswa.html', null);
                });
            } else if (btnText.includes('Tambah Pengajar')) {
                newBtn.addEventListener('click', () => {
                    this.loadContent('Tambah Pengajar', 'tambah_pengajar.html', null); 
                });
            } else if (btnText.includes('Tambah Kelas')) { 
                newBtn.addEventListener('click', () => {
                    this.loadTambahKelasContent();
                });
            } else {
                newBtn.addEventListener('click', () => {
                    console.log(`[AKSI CEPAT] Tombol "${btnText}" diklik.`);
                });
            }
        });
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: initTableActions *
    // **********************************************
    initTableActions() {
        // --- Logika Status Buttons (Lihat Detail Pendaftar) ---
        const statusButtons = document.querySelectorAll('.pendaftar-table .status-btn');
        
        statusButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.replaceWith(newButton);

            if (newButton.textContent.includes('Buka')) {
                newButton.innerHTML = '<i class="fas fa-search"></i> Lihat Detail'; 
            }

            if (newButton.textContent.includes('Lihat Detail')) {
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const row = e.target.closest('tr');
                    
                    if (row) {
                        const data = {
                            nama: row.cells[1].textContent.trim(),
                            tempatLahir: row.cells[2].textContent.trim(),
                            tanggalLahir: row.cells[3].textContent.trim(),
                            nomorWA: row.cells[4].textContent.trim(),
                            currentStatus: row.cells[5].textContent.trim(),
                            rowElement: row 
                        };
                        
                        document.dispatchEvent(new CustomEvent('openDetail', { detail: data }));
                    }
                });
            }
        });

        // --- Logika Tombol Edit (Ikon Pensil Pengajar) ---
        const editButtons = document.querySelectorAll('#pengajar-list-table .btn-edit');

        editButtons.forEach(button => {
            const newEditButton = button.cloneNode(true);
            button.replaceWith(newEditButton);
            
            newEditButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                const row = e.target.closest('tr');
                if (row) {
                    const idPengajar = row.getAttribute('data-id') || row.cells[0].textContent.trim();
                    
                    this.menuItems.forEach(i => i.classList.remove('active'));
                    this.loadDetailPengajarContent(idPengajar);
                } else {
                    console.warn('[AKSI EDIT] Row element tidak ditemukan.');
                }
            });
        });

        // --- Logika Status Toggle Aktif/Tidak Aktif ---
        const statusToggles = document.querySelectorAll('#pengajar-list-table .status-toggle');

        statusToggles.forEach(toggle => {
            const newToggle = toggle.cloneNode(true);
            toggle.replaceWith(newToggle);

            newToggle.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const currentStatus = newToggle.getAttribute('data-status');
                const newStatus = currentStatus === 'aktif' ? 'tidak-aktif' : 'aktif';
                
                const row = newToggle.closest('tr');
                const idPengajar = row ? row.getAttribute('data-id') : 'UNKNOWN';

                // 1. Panggil database placeholder
                const success = await this.saveDataToDatabase(idPengajar, { status: newStatus });

                if (success) {
                    // 2. Jika sukses, baru lakukan toggle visual
                    this.togglePengajarStatus(newToggle, newStatus);
                } else {
                    this.showNotification("Gagal mengubah status di server.", 'cancel');
                }
            });
        });
    }
    
    initLogout() {
        if (this.logoutButton) {
            const newLogoutButton = this.logoutButton.cloneNode(true);
            this.logoutButton.replaceWith(newLogoutButton);
            this.logoutButton = newLogoutButton;

            this.logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("[LOGOUT] Proses keluar dijalankan. Mengarahkan ke halaman login...");
            });
        }
    }

    initContentStatusActions() {
        const detailButtons = document.querySelectorAll('#siswa-list-table .status-detail, #siswa-list-table .status-accepted, #siswa-list-table .status-rejected');
        
        detailButtons.forEach(detailButton => {
            const newButton = detailButton.cloneNode(true);
            detailButton.replaceWith(newButton);

            if (newButton.textContent.includes('Lihat Detail')) {
                newButton.addEventListener('click', (e) => {
                    const row = e.target.closest('tr');
                    if (row) {
                        const data = {
                            nama: row.cells[1].textContent.trim(),
                            tempatLahir: row.cells[2].textContent.trim(),
                            tanggalLahir: row.cells[3].textContent.trim(),
                            nomorWA: row.cells[4].textContent.trim(),
                            currentStatus: row.cells[5].textContent.trim(),
                            rowElement: row 
                        };
                        
                        document.dispatchEvent(new CustomEvent('openDetail', { detail: data }));
                    }
                });
            }
        });
    }
}


// ====================================================================
// 2. KELAS UTAMA: PROFILE MANAGER (Logika Pop-up dan Update Tabel) - TIDAK DIUBAH
// ====================================================================
class ProfileManager {
    constructor() {
        // --- Elemen HTML Pop-up ---
        this.settingButton = document.querySelector('.footer-btn.setting');
        this.settingPopup = document.getElementById('popup-profile-setting');
        this.closeSettingPopupBtn = document.getElementById('close-setting-popup');
        this.cancelSettingPopupBtn = document.querySelector('.cancel-btn');
        this.saveButton = document.querySelector('.save-btn');
        this.notificationToast = document.getElementById('notification-toast');
        this.detailPopup = document.getElementById('popup-detail-pendaftar');
        this.detailAcceptBtn = document.querySelector('.action-btn-popup.detail-diterima');
        this.detailRejectBtn = document.querySelector('.action-btn-popup.detail-ditolak');
        this.profileNameInput = document.getElementById('profile-name-input');
        
        // Elemen Header/Mini Profile
        this.adminIcon = document.getElementById('dashboard-admin-icon');
        this.miniProfileCard = document.getElementById('popup-profile-mini');
        this.dashboardAdminName = document.getElementById('dashboard-admin-name');
        this.miniCardName = document.getElementById('mini-card-name');
        this.profileAvatarLarge = document.querySelector('.profile-avatar-large');
        
        this.currentRow = null; 
        this.currentProfile = { name: 'Rizka Sugiarto', email: 'admin@pesantren.com', phone: '0812-xxx-xxx' };

        // Inisialisasi listener
        this.rebindHeaderListeners(); 
        
        // Memastikan tombol Setting Profil terikat
        this.rebindSettingButton(); // <-- PANGGIL FUNGSI REBIND BUTTON SETTING

        this.initFormActions();
        this.initDetailPopupToggle(); 
        
        document.addEventListener('reInitProfileManager', () => this.rebindAllProfileActions()); // <-- PANGGIL ULANG REBIND
    }
    
    // **********************************************
    // * FUNGSI BARU: Rebind Tombol Setting/Logout *
    // **********************************************
    rebindSettingButton() {
        // Hapus listener lama pada Setting Button
        this.settingButton = document.querySelector('.footer-btn.setting');
        if (this.settingButton) {
            const newSettingButton = this.settingButton.cloneNode(true);
            this.settingButton.replaceWith(newSettingButton);
            this.settingButton = newSettingButton;
            this.initSettingPopupToggle();
        }
        
        // Rebind Logout Button
        if (this.logoutButton) {
            const newLogoutButton = this.logoutButton.cloneNode(true);
            this.logoutButton.replaceWith(newLogoutButton);
            this.logoutButton = newLogoutButton;

            this.logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("[LOGOUT] Proses keluar dijalankan. Mengarahkan ke halaman login...");
            });
        }
    }
    
    rebindAllProfileActions() {
        this.rebindHeaderListeners();
        this.rebindSettingButton(); // Rebind tombol setting setelah loadContent
        this.initFormActions(); 
        console.log("[PROFILE MANAGER] Tombol Setting, Logout, dan Header diikat ulang.");
    }
    
    // ... (Semua fungsi lain di ProfileManager tetap sama) ...
    
    rebindHeaderListeners() {
        this.adminIcon = document.getElementById('dashboard-admin-icon');
        this.miniProfileCard = document.getElementById('popup-profile-mini');
        this.dashboardAdminName = document.getElementById('dashboard-admin-name');
        this.miniCardName = document.getElementById('mini-card-name');

        if (!this.adminIcon || !this.miniProfileCard) return;

        // Kloning Ikon Admin untuk membersihkan listener lama
        const newAdminIcon = this.adminIcon.cloneNode(true);
        this.adminIcon.replaceWith(newAdminIcon);
        this.adminIcon = newAdminIcon;

        // Pasang listener Mini Pop-up baru
        this.adminIcon.addEventListener('click', () => {
            const isVisible = this.miniProfileCard.style.display === 'block';
            this.miniProfileCard.style.display = isVisible ? 'none' : 'block';
        });
        
        // Pasang listener mouseover/mouseleave
        this.adminIcon.addEventListener('mouseenter', () => {
            clearTimeout(this.miniProfileTimeout); 
            this.miniProfileCard.style.display = 'block';
        });
        this.adminIcon.addEventListener('mouseleave', () => {
            this.miniProfileTimeout = setTimeout(() => {
                this.miniProfileCard.style.display = 'none';
            }, 300);
        });

        this.updateAvatars(this.currentProfile.name);
    }
    
    updateAvatars(name) {
        const nameParts = name.split(' ');
        const shortName = nameParts.length > 0 ? nameParts[0] : 'Admin';
        
        if (this.dashboardAdminName) this.dashboardAdminName.textContent = shortName;
        if (this.miniCardName) this.miniCardName.textContent = name;
        
        if (document.getElementById('mini-card-email')) document.getElementById('mini-card-email').textContent = this.currentProfile.email;
        
        const initials = this.getInitials(name);
        const miniAvatar = document.querySelector('.profile-avatar-mini');
        if (miniAvatar) {
            const img = miniAvatar.querySelector('img');
            if (!img) { // Hanya update teks jika tidak ada gambar
                miniAvatar.textContent = initials;
            }
        }
    }
    
    getInitials(name) {
        if (!name) return 'R';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
        }
        return parts[0][0].toUpperCase();
    }
    
    // --- POPUP SETTING PROFILE ---
    
    initSettingPopupToggle() {
        if (!this.settingButton || !this.settingPopup) return;
        
        // Karena settingButton sudah direbind di rebindSettingButton, kita hanya pasang listener
        this.settingButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSettingPopup();
        });

        if (this.closeSettingPopupBtn) {
            const newCloseBtn = this.closeSettingPopupBtn.cloneNode(true);
            this.closeSettingPopupBtn.replaceWith(newCloseBtn);
            this.closeSettingPopupBtn = newCloseBtn;
            this.closeSettingPopupBtn.addEventListener('click', () => this.closeSettingPopup(false));
        }

        if (this.cancelSettingPopupBtn) {
            const newCancelBtn = this.cancelSettingPopupBtn.cloneNode(true);
            this.cancelSettingPopupBtn.replaceWith(newCancelBtn);
            this.cancelSettingPopupBtn = newCancelBtn;
            this.cancelSettingPopupBtn.addEventListener('click', () => this.closeSettingPopup(true));
        }
        
        this.settingPopup.addEventListener('click', (e) => {
            if (e.target === this.settingPopup) {
                this.closeSettingPopup(false);
            }
        });
    }

    openSettingPopup() {
        if (this.settingPopup) {
            if (document.getElementById('profile-name-input')) document.getElementById('profile-name-input').value = this.currentProfile.name;
            if (document.getElementById('profile-email-input')) document.getElementById('profile-email-input').value = this.currentProfile.email;
            if (document.getElementById('profile-phone-input')) document.getElementById('profile-phone-input').value = this.currentProfile.phone;

            this.updateDisplayedInitials(this.currentProfile.name);

            this.settingPopup.style.display = 'flex';
        }
    }
    
    closeSettingPopup(notify = false) {
        if (this.settingPopup) {
            this.settingPopup.style.display = 'none';
        }
        if (notify) {
            this.showNotification('Pengaturan Profil Dibatalkan.', 'cancel');
        }
    }

    initFormActions() { 
        if (!this.saveButton) return;
        
        const newSaveButton = this.saveButton.cloneNode(true);
        this.saveButton.replaceWith(newSaveButton);
        this.saveButton = newSaveButton;
        this.saveButton.addEventListener('click', () => this.handleSaveProfile());
        
        // INISIAL REAL-TIME
        this.profileNameInput = document.getElementById('profile-name-input');
        
        if (this.profileNameInput) {
            this.profileNameInput.addEventListener('input', (e) => this.updateDisplayedInitials(e.target.value));
        }
    }
    
    updateDisplayedInitials(name) {
        const initials = this.getInitials(name);
        const profileAvatarLarge = document.querySelector('.profile-avatar-large');
        
        if (profileAvatarLarge) {
            const img = profileAvatarLarge.querySelector('img');
            if (!img) { 
                profileAvatarLarge.textContent = initials;
            }
        }
    }

    handleSaveProfile() { 
        const newName = document.getElementById('profile-name-input').value;
        const newEmail = document.getElementById('profile-email-input').value;
        const newPhone = document.getElementById('profile-phone-input').value;
        
        this.currentProfile.name = newName;
        this.currentProfile.email = newEmail;
        this.currentProfile.phone = newPhone;
        
        this.updateAvatars(this.currentProfile.name);
        this.closeSettingPopup(false); 
        this.showNotification('Profil Berhasil Diperbarui.', 'success'); 
    }

    // ... (Logika Detail Pendaftar dan fungsi pendukung lainnya tetap sama) ...
    
    initDetailPopupToggle() {
        if (!this.detailPopup) return;

        const closeDetailPopupBtn = document.getElementById('close-detail-popup');
        if (closeDetailPopupBtn) { closeDetailPopupBtn.addEventListener('click', () => this.closeDetailPopup(false)); }

        if (this.detailAcceptBtn) { this.detailAcceptBtn.addEventListener('click', () => this.handleAccept()); }
        if (this.detailRejectBtn) { this.detailRejectBtn.addEventListener('click', () => this.handleReject()); }
    }

    openDetailPopup(data) {
        if (!this.detailPopup) return;
        this.currentRow = data.rowElement || null; 
        
        if (document.getElementById('detail-name')) document.getElementById('detail-name').textContent = data.nama || '-';
        this.detailPopup.style.display = 'flex';
    }

    closeDetailPopup(notify = false) {
        if (this.detailPopup) {
            this.detailPopup.style.display = 'none';
        }
        if (notify) {
            this.showNotification('Pengaturan Profil Dibatalkan.', 'cancel');
        }
    }

    updateTableRowStatus(status) {
        if (!this.currentRow) return;

        const statusCellIndex = this.currentRow.cells.length - 1; 
        const statusCell = this.currentRow.cells[statusCellIndex]; 
        
        if (!statusCell) return;

        let newText;
        let newClass;
        
        if (status === 'DITERIMA') {
            newText = 'Diterima';
            newClass = 'status-accepted';
        } else {
            newText = 'Ditolak';
            newClass = 'status-rejected';
        }
        
        statusCell.innerHTML = `<button class="status-button ${newClass}">${newText}</button>`;
    }
    
    handleAccept() {
        this.updateTableRowStatus('DITERIMA'); 
        this.closeDetailPopup(); 
    }
    
    handleReject() {
        this.updateTableRowStatus('DITOLAK'); 
        this.closeDetailPopup(); 
    }

    showNotification(message, type = 'success') { 
        if (!this.notificationToast) return;
        this.notificationToast.textContent = message;
        this.notificationToast.className = `toast-notification show ${type}`;
        setTimeout(() => {
            this.notificationToast.classList.remove('show');
            setTimeout(() => { this.notificationToast.className = 'toast-notification'; }, 300); 
        }, 1500); 
    }
}


// ====================================================================
// 3. INISIALISASI APLIKASI DAN GLOBAL EVENT LISTENER
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();
    window.uiManager = uiManager;
    const profileManager = new ProfileManager();
    
    document.addEventListener('openDetail', (e) => {
        profileManager.openDetailPopup(e.detail);
    });
    
    console.log("Dashboard Script berhasil dimuat dan diinisialisasi.");
});
import { apiGet, apiPut } from "./apiService.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Ambil profile admin
        const me = await apiGet("/me");
        console.log("ADMIN PROFILE:", me);
        const profile = me?.profile ?? me ?? {};

        // tampilkan nama di header
        const namaEl = document.getElementById("dashboard-admin-name");
        if (namaEl) namaEl.innerText = profile?.nama ?? "Admin";

        // isi mini profile popup (agar bukan data bohong)
        const miniName = document.getElementById("mini-card-name");
        const miniEmail = document.getElementById("mini-card-email");
        const miniPhone = document.querySelector("#popup-profile-mini .profile-info-mini .profile-detail:nth-child(3)");
        if (miniName) miniName.innerText = profile?.nama ?? "-";
        if (miniEmail) miniEmail.innerText = profile?.email ?? "-";
        if (miniPhone) miniPhone.innerText = profile?.no_wa ?? profile?.no_kontak ?? "-";

        // isi form profile setting jika ada
        const inpNama = document.getElementById("profile_nama");
        const inpEmail = document.getElementById("profile_email");
        const inpTelepon = document.getElementById("profile_telepon");
        if (inpNama) inpNama.value = profile?.nama ?? "";
        if (inpEmail) inpEmail.value = profile?.email ?? profile?.email_admin ?? "";
        if (inpTelepon) inpTelepon.value = profile?.no_wa ?? profile?.no_kontak ?? "";

        // Ambil data pendaftar
        const pendaftar = (await apiGet("/pendaftar")) || [];
        console.log("DATA PENDAFTAR:", pendaftar);

        // simpan global supaya detail bisa diambil tanpa req tambahan
        window._pendaftarList = Array.isArray(pendaftar) ? pendaftar : [pendaftar];

        // update total pendaftar
        const totalPendaftarEl = document.getElementById("totalPendaftar");
        if (totalPendaftarEl) totalPendaftarEl.innerText = window._pendaftarList.length;

        // render tabel pendaftar (pakai table id #tablePendaftar)
        const table = document.getElementById("tablePendaftar");
        const tbody = table?.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = "";
            const list = window._pendaftarList;
            if (!list || list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Belum ada pendaftar.</td></tr>`;
            } else {
                list.forEach((p, i) => {
                    const tanggal = p.tanggal_lahir ? new Date(p.tanggal_lahir).toLocaleDateString("id-ID") : "-";
                    // pastikan id exist (backend pakai id_pendaftar)
                    const id = p.id_pendaftar ?? p.id ?? "";
                    tbody.innerHTML += `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${p.nama ?? "-"}</td>
                            <td>${p.tempat_lahir ?? "-"}</td>
                            <td>${tanggal}</td>
                            <td>${p.no_wa ?? "-"}</td>
                            <td><button class="btn-detail" data-id="${id}">Lihat Detail</button></td>
                        </tr>
                    `;
                });
            }
        } else {
            console.warn("Tabel pendaftar (#tablePendaftar) tidak ditemukan di HTML.");
        }

        // Ambil data kelas untuk statistik
        const kelas = (await apiGet("/kelas")) || [];
        console.log("DATA KELAS:", kelas);
        const totalKelasEl = document.getElementById("totalKelas");
        if (totalKelasEl) totalKelasEl.innerText = Array.isArray(kelas) ? kelas.length : 0;

        // hitung total santri dewasa & anak via kelas/detail
        let totalDewasa = 0;
        let totalAnak = 0;
        if (Array.isArray(kelas) && kelas.length > 0) {
            for (const k of kelas) {
                try {
                    const detail = await apiGet(`/kelas/detail/${k.id_kelas}`);
                    const santriList = detail?.santri ?? [];
                    const count = Array.isArray(santriList) ? santriList.length : (santriList ? 1 : 0);
                    if ((k.kategori ?? "").toLowerCase() === "dewasa") totalDewasa += count;
                    else if ((k.kategori ?? "").toLowerCase() === "anak") totalAnak += count;
                } catch (err) {
                    console.warn("Gagal ambil detail kelas", k.id_kelas, err);
                }
            }
        }
        const elDewasa = document.getElementById("totalSantriDewasa");
        const elAnak = document.getElementById("totalSantriAnak");
        if (elDewasa) elDewasa.innerText = totalDewasa;
        if (elAnak) elAnak.innerText = totalAnak;

        // total pengajar (unique nama_pengajar)
        const uniquePengajar = new Set();
        if (Array.isArray(kelas)) kelas.forEach(k => { if (k?.nama_pengajar) uniquePengajar.add(k.nama_pengajar); });
        const elPengajar = document.getElementById("totalPengajar");
        if (elPengajar) elPengajar.innerText = uniquePengajar.size;

        console.log("Dashboard data populated.");

    } catch (err) {
        console.error("ERROR DASHBOARD ADMIN:", err);
    }
});

// =========================
// Detail pendaftar: gunakan data lokal (window._pendaftarList)
// Jika tidak ada, coba fallback ke API (tetapi backend belum sediakan GET /pendaftar/:id)
// =========================
document.addEventListener("click", async (e) => {
    const target = e.target;
    if (!target.classList || !target.classList.contains("btn-detail")) return;

    const id = target.dataset.id;
    if (!id) return alert("ID pendaftar tidak ditemukan.");

    console.log("Lihat detail pendaftar:", id);

    try {
        let data = null;
        const list = window._pendaftarList || [];
        if (list.length > 0) {
            data = list.find(x => String(x.id_pendaftar ?? x.id ?? "") === String(id));
        }
        // fallback: coba panggil endpoint /pendaftar/:id (hanya jika backend sediakan)
        if (!data) {
            try {
                data = await apiGet(`/pendaftar/${id}`); // kemungkinan 404 jika route tidak ada
            } catch (err) {
                console.warn("GET /pendaftar/:id gagal (mungkin tidak disediakan).", err);
            }
        }

        if (!data) {
            alert("Detail pendaftar tidak tersedia (backend tidak menyediakan endpoint detail).");
            return;
        }

        // isi popup
        const setText = (sel, txt) => {
            const el = document.getElementById(sel);
            if (el) el.innerText = txt ?? "-";
        };

        setText("detail-name", data.nama ?? "-");
        setText("detail-tempat-lahir", data.tempat_lahir ?? "-");
        setText("detail-tanggal-lahir", data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString("id-ID") : "-");
        setText("detail-whatsapp", data.no_wa ?? "-");
        setText("detail-email", data.email ?? "-");

        const statusTitle = document.getElementById("detail-status-title");
        if (statusTitle) statusTitle.innerText = `Status: ${data.status ?? "pending"}`;

        // simpan id untuk aksi
        const popup = document.getElementById("popup-detail-pendaftar");
        if (popup) popup.dataset.idPendaftar = id;

        // tampilkan popup (pastikan CSS untuk .popup-overlay menampilkan dengan flex atau block)
        if (popup) popup.style.display = "flex";

    } catch (err) {
        console.error("Gagal mengambil detail:", err);
        alert("Tidak dapat mengambil detail pendaftar!");
    }
});

// tutup popup detail (safety: cek eksistensi)
const closeBtn = document.getElementById("close-detail-popup");
if (closeBtn) closeBtn.addEventListener("click", () => {
    const popup = document.getElementById("popup-detail-pendaftar");
    if (popup) popup.style.display = "none";
});

// tombol terima/tolak di popup (safety guards)
const diterimaBtn = document.querySelector(".detail-diterima");
if (diterimaBtn) {
    diterimaBtn.addEventListener("click", async () => {
        const id = document.getElementById("popup-detail-pendaftar").dataset.idPendaftar;
        if (!id) return alert("ID tidak ditemukan.");
        try {
            await apiPut(`/pendaftar/terima/${id}`);
            alert("Pendaftar diterima.");
            location.reload();
        } catch (e) {
            console.error(e);
            alert("Gagal menerima pendaftar.");
        }
    });
}

const ditolakBtn = document.querySelector(".detail-ditolak");
if (ditolakBtn) {
    ditolakBtn.addEventListener("click", async () => {
        const id = document.getElementById("popup-detail-pendaftar").dataset.idPendaftar;
        if (!id) return alert("ID tidak ditemukan.");
        try {
            await apiPut(`/pendaftar/tolak/${id}`);
            alert("Pendaftar ditolak.");
            location.reload();
        } catch (e) {
            console.error(e);
            alert("Gagal menolak pendaftar.");
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const pendaftar = await apiGet("/pendaftar");

        const tbody = document.querySelector("#tablePendaftar tbody");
        tbody.innerHTML = "";

        if (pendaftar.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada pendaftar.</td></tr>`;
            return;
        }

        pendaftar.forEach((p, i) => {
            const tgl = p.tanggal_lahir
                ? new Date(p.tanggal_lahir).toLocaleDateString("id-ID")
                : "-";

            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.nama}</td>
                    <td>${p.tempat_lahir}</td>
                    <td>${tgl}</td>
                    <td>${p.no_wa}</td>
                    <td><button class="btn-detail" data-id="${p.id_pendaftar}">Lihat Detail</button></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat data siswa:", err);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const kelas = await apiGet("/kelas");

        const tbody = document.querySelector("#tableKelas tbody");
        tbody.innerHTML = "";

        kelas.forEach((k, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${k.nama_kelas}</td>
                    <td>${k.kapasitas ?? "-"}</td>
                    <td>${k.kategori}</td>
                    <td>${k.nama_pengajar ?? "-"}</td>
                    <td>
                        <button class="btn-edit" data-id="${k.id_kelas}">+</button>
                        <button class="btn-delete" data-id="${k.id_kelas}">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat data kelas:", err);
    }
});


// ====================================================================
// 1. KELAS UTAMA: UIManager (Manajemen Konten dan Navigasi)
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
        this.currentSantriId = null; // **PROPERTI BARU**

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
    async saveDataToDatabase(id, data) {
        // Simulasi penundaan penyimpanan
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (data && data.action === 'delete') {
            return true;
        }
        return true;
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: Mengambil Data Siswa (20 Data Dummy) *
    // **********************************************
    async getSiswaDataByKelasId(kelasId) {
        // ... (Fungsi getSiswaDataByKelasId tetap sama) ...
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log(`[API SIMULASI] Mengambil 20 data siswa untuk Kelas ID: ${kelasId}`);

        const siswaData = [];
        const namaContoh = ["Ahmad", "Budi", "Citra", "Dewi", "Eko", "Fina", "Gani", "Hana", "Iwan", "Jati"];
        
        for (let i = 1; i <= 20; i++) {
            const baseIndex = (i - 1) % namaContoh.length;
            const nama = `${namaContoh[baseIndex]} ${i}`;
            const nim = `2459267${(100 + i).toString().padStart(3, '0')}`;
            const umur = 18 + (i % 5);
            
            siswaData.push({
                nim: nim,
                nama: nama,
                umur: umur,
                kelas: "Idat Awal"
            });
        }

        return siswaData;
    }

    // **********************************************
    // * FUNGSI BARU: Handler Modal Daftar Siswa (Ikon Mata) *
    // **********************************************
    async handleViewSiswaModal(row) {
        // ... (Fungsi handleViewSiswaModal tetap sama) ...
        const modal = document.getElementById('siswa-list-modal');
        const modalTitle = document.getElementById('modal-siswa-title');
        const siswaTableBody = document.getElementById('siswa-table-body');
        const closeBtn = document.getElementById('close-siswa-modal');

        if (!modal) {
            console.error('Modal Daftar Siswa tidak ditemukan (ID: siswa-list-modal).');
            return;
        }

        const kelasId = row.getAttribute('data-id') || 'UNKNOWN';
        const namaKelas = row.cells[1].textContent.trim();
        
        modalTitle.textContent = `Daftar Siswa Kelas ${namaKelas}`;
        siswaTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>';
        modal.style.display = 'flex';
        
        try {
            const siswaData = await this.getSiswaDataByKelasId(kelasId);
            
            siswaTableBody.innerHTML = ''; // Kosongkan
            if (siswaData.length === 0) {
                siswaTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada siswa di kelas ini.</td></tr>';
            } else {
                siswaData.forEach((siswa, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}.</td>
                        <td>${siswa.nim}</td>
                        <td>${siswa.nama}</td>
                        <td>${siswa.umur}</td>
                        <td>${siswa.kelas}</td>
                    `;
                    siswaTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            siswaTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Gagal memuat data siswa.</td></tr>';
            console.error('[ERROR] Gagal memuat data siswa:', error);
        }

        closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        console.log(`[MODAL] Modal Daftar Siswa untuk Kelas ${namaKelas} ditampilkan.`);
    }

    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi Ikon Mata *
    // **********************************************
    initViewSiswaAction() {
        const tableBody = document.getElementById('kelas-table-body');
        if (!tableBody) return;

        tableBody.addEventListener('click', (e) => {
            const viewButton = e.target.closest('.btn-view-siswa');
            
            if (viewButton) {
                const row = viewButton.closest('.table-data-row');
                if (row) {
                    this.handleViewSiswaModal(row);
                }
            }
        });
    }

    // **********************************************
    // * FUNGSI BARU: Logic Toggle Status (Tabel) *
    // **********************************************
    togglePengajarStatus(element, newStatus) {
        // ... (Fungsi togglePengajarStatus tetap sama) ...
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
        // ... (Fungsi updatePengajarRowStatus tetap sama) ...
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
        // ... (Fungsi initDetailEditActions tetap sama) ...
        const editButton = document.getElementById('btn-edit-mode');
        const saveButton = document.getElementById('btn-save-mode');
        const cancelButton = document.getElementById('btn-cancel-mode');
        const deleteAccountButton = document.getElementById('btn-hapus-akun-detail');
        const viewAbsensiButton = document.getElementById('btn-lihat-absensi');

        const formFields = document.querySelectorAll('#form-detail-pengajar .profile-input');
        const statusDisplayInput = document.getElementById('input-status-display');

        const modal = document.getElementById('delete-confirm-modal');
        const modalPengajarId = document.getElementById('modal-pengajar-id');
        const modalBtnDelete = document.getElementById('modal-btn-delete');
        const modalBtnCancel = document.getElementById('modal-btn-cancel');
        
        if (!editButton) return;

        let initialValues = {};
        
        const captureInitialValues = () => {
            formFields.forEach(field => {
                initialValues[field.id] = field.value;
            });
        };

        const setEditMode = (isEdit) => {
            if (isEdit) {
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
                formFields.forEach(field => {
                    field.disabled = true;
                    field.style.backgroundColor = '#f7f7f7';
                });
                
                if(statusDisplayInput) {
                    statusDisplayInput.style.backgroundColor = statusDisplayInput.value === 'Aktif' ? '#4CAF50' : '#f44336';
                    statusDisplayInput.style.color = 'white';
                }

                editButton.style.display = 'inline-block';
                saveButton.style.display = 'none';
                cancelButton.style.display = 'none';
            }
        };
        
        editButton.addEventListener('click', () => setEditMode(true));
        
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const pengajarId = this.currentPengajarId;
            
            const updatedData = {
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
                
                if (modalPengajarId) {
                    modalPengajarId.textContent = pengajarId;
                }
                modal.style.display = 'block';
            });
        }
        
        if (modalBtnCancel && modal) {
            modalBtnCancel.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }
        
        if (modalBtnDelete && modal) {
            modalBtnDelete.addEventListener('click', async () => {
                if (modal) modal.style.display = 'none';
                
                const pengajarId = this.currentPengajarId;
                const success = await this.saveDataToDatabase(pengajarId, { action: 'delete' });

                if (success) {
                    this.showNotification(`Akun ID ${pengajarId} berhasil dihapus.`, 'success');
                    
                    const rowToDelete = document.querySelector(`#pengajar-list-table tr[data-id="${pengajarId}"]`);
                    if (rowToDelete) {
                        rowToDelete.remove();
                    }
                    
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
        
        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        if (viewAbsensiButton) {
            viewAbsensiButton.addEventListener('click', () => {
                const pengajarId = this.currentPengajarId;
                this.showNotification(`Mengarahkan ke Riwayat Absensi Pengajar ID ${pengajarId} (Fungsi navigasi perlu diimplementasikan).`, 'info');
            });
        }

        setEditMode(false);
    }
    
    // **********************************************
    // * FUNGSI BARU: Inisialisasi Logika Edit/Simpan Detail SANTRI *
    // **********************************************
    initDetailSantriEditActions() {
        const editButton = document.getElementById('btn-edit-mode');
        const saveButton = document.getElementById('btn-save-mode');
        const cancelButton = document.getElementById('btn-cancel-mode');

        // Pastikan selector form ini spesifik untuk detail santri
        const formFields = document.querySelectorAll('#form-detail-santri .detail-input, #form-detail-santri .detail-select');
        const categoryCard = document.querySelector('#form-detail-santri .category-card');
        
        if (!editButton) return;

        let initialValues = {};
        
        const captureInitialValues = () => {
            formFields.forEach(field => {
                initialValues[field.id] = field.value;
            });
        };

        const setEditMode = (isEdit) => {
            if (isEdit) {
                captureInitialValues();
                formFields.forEach(field => {
                    // NISN, Terdaftar, Role tidak bisa diedit
                    if (field.id !== 'input-nisn' && field.id !== 'input-terdaftar' && field.id !== 'input-role') {
                        field.disabled = false;
                        field.style.backgroundColor = '#fff';
                    }
                    // Khusus untuk input-status, ubah ke select jika ada
                    if (field.id === 'input-status') {
                        // Jika input status adalah text, kita akan mengabaikannya untuk saat ini
                        // Di implementasi nyata, status harus diganti menjadi <select> saat mode edit
                    }
                });
                
                editButton.style.display = 'none';
                saveButton.style.display = 'inline-block';
                cancelButton.style.display = 'inline-block';
            } else {
                formFields.forEach(field => {
                    field.disabled = true;
                    field.style.backgroundColor = '#F7F7F7'; // Warna non-editable
                });
                
                // Pastikan Status dan Role tetap berwarna (Jika ada CSS styling)
                const inputStatusDisplay = document.getElementById('input-status');
                const inputRoleDisplay = document.getElementById('input-role');

                if (inputStatusDisplay) { inputStatusDisplay.style.backgroundColor = '#38761d'; inputStatusDisplay.style.color = 'white'; }
                if (inputRoleDisplay) { inputRoleDisplay.style.backgroundColor = '#6aa84f'; inputRoleDisplay.style.color = 'white'; }


                editButton.style.display = 'inline-block';
                saveButton.style.display = 'none';
                cancelButton.style.display = 'none';
            }
        };
        
        editButton.addEventListener('click', () => setEditMode(true));
        
        // HANDLER SIMPAN
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const santriId = this.currentSantriId;
            
            const updatedData = {
                // Ambil semua field dari form detail santri
                nama: document.getElementById('input-nama-lengkap').value,
                alamat: document.getElementById('input-alamat').value,
                tglLahir: document.getElementById('input-tanggal-lahir').value,
                tempatLahir: document.getElementById('input-tempat-lahir').value,
                telepon: document.getElementById('input-no-telepon').value,
                kelas: document.getElementById('input-kelas').value,
                username: document.getElementById('input-username').value,
                email: document.getElementById('input-email').value,
                // Status dan Role tidak diubah melalui form ini (dianggap kompleks)
            };

            const success = await this.saveDataToDatabase(santriId, { action: 'update_santri', data: updatedData });

            if (success) {
                this.showNotification(`Data Santri ID ${santriId} berhasil disimpan!`, 'success');
                setEditMode(false);
            } else {
                this.showNotification("Gagal menyimpan data Santri ke server.", 'cancel');
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
        
        // Panggil mode non-edit saat pertama kali dimuat
        setEditMode(false);
    }
    
    // --- ROUTING/CONTENT MANAGEMENT ---
    
    loadDashboardContent() {
        // ... (Fungsi loadDashboardContent tetap sama) ...
        if (this.mainContent && this.initialDashboardHTML) {
            this.mainContent.innerHTML = this.initialDashboardHTML;
            
            this.initQuickActions();
            this.initTableActions();
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
    // * FUNGSI BARU: Muat Konten DAFTAR SANTRI *
    // **********************************************
    async loadDaftarSantriContent() {
        if (!this.mainContent) return;

        try {
            const targetFilename = 'daftar_santri.html';
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat halaman Daftar Santri. Pastikan file ${targetFilename} tersedia.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            // Set menu 'Daftar Santri' menjadi aktif di sidebar
            this.menuItems.forEach(i => i.classList.remove('active'));
            const santriMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Santri');
            if (santriMenuItem) {
                santriMenuItem.classList.add('active');
            }

            // Inisialisasi aksi di halaman Daftar Santri (termasuk ikon pensil)
            this.initDaftarSantriActions(); // **FUNGSI BARU**
            this.initTableActions(); // Inisialisasi ulang aksi tabel umum
            
            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            console.log("[CONTENT] Konten Daftar Santri berhasil dimuat.");

        } catch (error) {
            console.error(`[ERROR ROUTING Daftar Santri]`, error);
        }
    }
    
    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi di Halaman Daftar Santri *
    // **********************************************
    initDaftarSantriActions() {
        const tableBody = document.getElementById('santri-table-body');
        if (!tableBody) return;

        // Logika Klik Ikon Pensil (Edit/Detail)
        tableBody.addEventListener('click', (e) => {
            const editButton = e.target.closest('.btn-edit-santri-detail');
            
            if (editButton) {
                const santriId = editButton.getAttribute('data-santri-id');
                if (santriId) {
                    // Navigasi ke halaman detail
                    this.loadDetailSantriContent(santriId);
                } else {
                    console.warn('[AKSI EDIT SANTRI] ID Santri tidak ditemukan.');
                }
            }
        });
    }

    // **********************************************
    // * FUNGSI BARU: Muat Konten DETAIL SANTRI *
    // **********************************************
    async loadDetailSantriContent(santriId) {
        if (!this.mainContent) return;

        this.currentSantriId = santriId; // **SIMPAN ID SANTRI AKTIF**
        const data = SANTRI_DATA_SIMULASI[santriId];
        
        if (!data) {
            this.showNotification(`Data Santri ID ${santriId} tidak ditemukan.`, 'cancel');
            this.loadDaftarSantriContent();
            return;
        }

        try {
            const targetFilename = 'detail_santri.html';
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat detail santri.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            // Pastikan tombol 'Kembali' mengarahkan ke Daftar Santri
            this.initBackButton('Daftar Santri'); 
            
            // 2. Suntikkan Data ke form detail
            document.getElementById('input-nisn').value = data.nisn;
            document.getElementById('input-nama-lengkap').value = data.nama;
            document.getElementById('input-alamat').value = data.alamat;
            // Gunakan format YYYY-MM-DD untuk input type=date
            document.getElementById('input-tanggal-lahir').value = data.tanggalLahir; 
            document.getElementById('input-tempat-lahir').value = data.tempatLahir;
            document.getElementById('input-no-telepon').value = data.noTelp;
            document.getElementById('input-kelas').value = data.kelas; // Select
            
            // Set Category Card
            const categoryCard = document.querySelector('#form-detail-santri .category-card');
            if (categoryCard) {
                 categoryCard.textContent = data.kategori;
                 // Asumsi: Kita atur warna berdasarkan kategori jika perlu (tidak ada di CSS yang diberikan)
            }

            document.getElementById('input-username').value = data.username;
            document.getElementById('input-email').value = data.email;
            document.getElementById('input-status').value = data.status;
            document.getElementById('input-role').value = data.role;
            document.getElementById('input-terdaftar').value = data.terdaftar; // Input type text

            // 3. Panggil inisialisasi Edit/Simpan
            this.initDetailSantriEditActions(); // **FUNGSI BARU**
            
            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            
            console.log(`[CONTENT] Konten Detail Santri (ID: ${santriId}) berhasil dimuat.`);

        } catch (error) {
            console.error(`[ERROR ROUTING Detail Santri]`, error);
        }
    }

    // **********************************************
    // * FUNGSI BARU: Muat Konten Daftar Jadwal *
    // **********************************************
    async loadDaftarJadwalContent() {
        // ... (Fungsi loadDaftarJadwalContent tetap sama) ...
        if (!this.mainContent) return;

        try {
            const targetFilename = 'daftar_jadwal.html';
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat halaman Daftar Jadwal. Pastikan file ${targetFilename} tersedia.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            this.menuItems.forEach(i => i.classList.remove('active'));
            const jadwalMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Jadwal');
            if (jadwalMenuItem) {
                jadwalMenuItem.classList.add('active');
            }

            this.initJadwalActions();
            this.initTableActions();
            
            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            console.log("[CONTENT] Konten Daftar Jadwal berhasil dimuat.");

        } catch (error) {
            console.error(`[ERROR ROUTING Daftar Jadwal]`, error);
        }
    }

    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi Modal Edit Jadwal *
    // **********************************************
    initEditJadwalModalActions() {
        // ... (Fungsi initEditJadwalModalActions tetap sama) ...
        const modal = document.getElementById('edit-jadwal-modal');
        if (!modal) return;

        const closeBtn = document.getElementById('close-edit-jadwal-modal');
        const batalBtn = document.getElementById('btn-batal-edit');
        const form = document.getElementById('form-edit-jadwal');

        const closeModal = () => modal.style.display = 'none';

        if (closeBtn) closeBtn.onclick = closeModal;
        if (batalBtn) batalBtn.onclick = () => {
            closeModal();
            this.showNotification('Pengeditan jadwal dibatalkan.', 'cancel');
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const jadwalId = modal.getAttribute('data-current-jadwal-id') || 'UNKNOWN';
                
                const data = {
                    pengajar: document.getElementById('pengajar-utama').value,
                    periodeMulai: document.getElementById('periode-mulai').value,
                };

                const success = await this.saveDataToDatabase(jadwalId, { action: 'edit_jadwal', data });

                closeModal();
                if (success) {
                    this.showNotification(`Jadwal ID ${jadwalId} berhasil diperbarui!`, 'success');
                } else {
                    this.showNotification('Gagal menyimpan perubahan jadwal.', 'cancel');
                }
            };
        }
        
        const sesiTableBody = document.getElementById('sesi-table-body');
        if (sesiTableBody) {
             sesiTableBody.onclick = (e) => {
                 const deleteBtn = e.target.closest('.btn-hapus-sesi');
                 if (deleteBtn) {
                     e.preventDefault();
                     const row = deleteBtn.closest('tr');
                     if (confirm("Yakin hapus sesi ini?")) {
                         row.remove();
                         this.showNotification('Sesi berhasil dihapus (simulasi).', 'cancel');
                     }
                 }
             };
        }
        
        const btnTambahSesi = document.querySelector('.btn-tambah-sesi');
        if (btnTambahSesi) {
            btnTambahSesi.onclick = () => {
                 this.showNotification('Simulasi: Menambahkan baris sesi baru di tabel.', 'info');
            };
        }
    }

    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi Modal Tambah Jadwal Baru *
    // **********************************************
    initTambahJadwalModalActions() {
        // ... (Fungsi initTambahJadwalModalActions tetap sama) ...
        const modal = document.getElementById('tambah-jadwal-modal');
        if (!modal) return;

        const closeBtn = document.getElementById('close-tambah-jadwal-modal');
        const batalBtn = document.getElementById('btn-batal-tambah-baru');
        const form = document.getElementById('form-tambah-jadwal-baru');

        const closeModal = () => modal.style.display = 'none';

        if (closeBtn) closeBtn.onclick = closeModal;
        if (batalBtn) batalBtn.onclick = () => {
            closeModal();
            this.showNotification('Penambahan jadwal dibatalkan.', 'cancel');
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                this.showNotification('Simulasi: Menyimpan jadwal baru...', 'info');
                
                const data = {
                    kelas: document.getElementById('kelas-tingkatan-baru').value,
                    pengajar: document.getElementById('pengajar-baru').value,
                    hari: document.getElementById('hari-baru').value,
                    waktuMulai: document.getElementById('waktu-mulai-baru').value,
                };

                const success = await this.saveDataToDatabase(null, { action: 'tambah_jadwal_baru', data });

                closeModal();
                if (success) {
                    this.showNotification(`Jadwal untuk ${data.kelas} berhasil ditambahkan!`, 'success');
                } else {
                    this.showNotification('Gagal menambahkan jadwal baru.', 'cancel');
                }
            };
        }
    }


    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi di Halaman Daftar Jadwal *
    // **********************************************
    initJadwalActions() {
        // ... (Fungsi initJadwalActions tetap sama) ...
        const btnTambah = document.getElementById('btn-tambah-jadwal');
        const tableBody = document.getElementById('jadwal-table-body');
        const editModal = document.getElementById('edit-jadwal-modal');
        const tambahModal = document.getElementById('tambah-jadwal-modal');
        
        if (btnTambah && tambahModal) {
             btnTambah.onclick = () => {
                 tambahModal.style.display = 'flex';
                 const form = document.getElementById('form-tambah-jadwal-baru');
                 if (form) form.reset();
             };
        }
        
        if (tableBody && editModal) {
             tableBody.addEventListener('click', (e) => {
                 const editButton = e.target.closest('.btn-edit-jadwal');
                 const deleteButton = e.target.closest('.btn-delete-jadwal');
                 
                 if (editButton) {
                     const row = editButton.closest('.table-data-row');
                     const jadwalId = row.getAttribute('data-id');
                     const kelasNama = row.cells[1].textContent.trim();
                     const pengajarNama = row.cells[2].textContent.trim();

                     document.getElementById('edit-modal-title').textContent = `Edit Jadwal Kelas: ${kelasNama} (Dewasa)`;
                     editModal.setAttribute('data-current-jadwal-id', jadwalId);
                     editModal.style.display = 'flex';
                     
                     const pengajarSelect = document.getElementById('pengajar-utama');
                     if (pengajarSelect) pengajarSelect.value = pengajarNama.toLowerCase();
                     
                     console.log(`[MODAL] Membuka edit modal untuk Jadwal ID ${jadwalId}`);

                 } else if (deleteButton) {
                     const row = deleteButton.closest('.table-data-row');
                     const jadwalId = row.getAttribute('data-id');
                     if (confirm(`Yakin hapus Jadwal ID ${jadwalId}?`)) {
                         row.remove();
                         this.showNotification(`Jadwal ID ${jadwalId} berhasil dihapus (Simulasi)`, 'cancel');
                     }
                 }
             });
        }
        
        this.initEditJadwalModalActions();
        this.initTambahJadwalModalActions();
    }
    
    // **********************************************
    // * FUNGSI MODIFIKASI: loadDaftarKelasSantriContent *
    // **********************************************
    async loadDaftarKelasSantriContent(data = null) {
        // ... (Fungsi loadDaftarKelasSantriContent tetap sama) ...
        if (!this.mainContent) return;
        
        const targetFilename = 'daftar_kelas_santri.html';

        try {
            const response = await fetch(targetFilename);
            
            if (!response.ok) {
                console.error(`File ${targetFilename} tidak ditemukan.`);
                this.mainContent.innerHTML = `<h1>Error</h1><p>Gagal memuat halaman Daftar Kelas Santri. Pastikan file ${targetFilename} tersedia.</p>`;
                return;
            }

            let htmlContent = await response.text();
            this.mainContent.innerHTML = htmlContent;

            this.menuItems.forEach(i => i.classList.remove('active'));
            const daftarKelasItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Kelas');
            if (daftarKelasItem) {
                daftarKelasItem.classList.add('active');
            }
            
            this.initDaftarKelasSantriActions();
            this.initBackButton('Dashboard');
            this.initClassFilter();

            document.dispatchEvent(new CustomEvent('reInitProfileManager'));
            console.log(`[CONTENT] Konten Daftar Kelas Santri dari ${targetFilename} berhasil dimuat. Menu Sidebar: Daftar Kelas (Aktif).`);

        } catch (error) {
            console.error(`[ERROR ROUTING Daftar Kelas Santri]`, error);
        }
    }

    // **********************************************
    // * FUNGSI BARU: Logika Filter Tabel Kelas Santri *
    // **********************************************
    initClassFilter() {
        // ... (Fungsi initClassFilter tetap sama) ...
        const filterSelect = document.getElementById('kelas-filter-select');
        const tableBody = document.getElementById('santri-kelas-table-body');
        
        if (!filterSelect || !tableBody) return;

        const applyFilter = () => {
            const selectedValue = filterSelect.value;
            const rows = tableBody.querySelectorAll('.table-data-row');

            rows.forEach(row => {
                const statusKelas = row.getAttribute('data-status-kelas');
                
                if (selectedValue === 'semua') {
                    row.style.display = '';
                } else if (selectedValue === 'belum-ada-kelas') {
                    if (statusKelas.includes('Belum Ada') || statusKelas.includes('Menunggu')) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                } else if (selectedValue === 'sudah-ada-kelas') {
                    if (statusKelas.includes('Santri') || statusKelas.includes('Sudah Ada')) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
            console.log(`[FILTER] Filter diterapkan: ${selectedValue}`);
        };

        filterSelect.addEventListener('change', applyFilter);
        applyFilter();
    }


    // **********************************************
    // * FUNGSI BARU: Inisialisasi Aksi di Halaman Daftar Kelas Santri *
    // **********************************************
    initDaftarKelasSantriActions() {
        // ... (Fungsi initDaftarKelasSantriActions tetap sama) ...
        const saveButton = document.querySelector('.save-class-changes-btn');
        const filterSelect = document.getElementById('kelas-filter-select');

        // 1. Aksi Tombol Edit (Ikon Pensil) di tabel santri (Simulasi)
        const tableBody = document.getElementById('santri-kelas-list-table');
        if (tableBody) {
             tableBody.addEventListener('click', (e) => {
                 const editButton = e.target.closest('.btn-edit-santri-class');
                 if (editButton) {
                     const santriId = editButton.getAttribute('data-santri-id');
                     this.showNotification(`Simulasi: Membuka detail edit untuk Santri ID ${santriId}.`, 'info');
                 }
             });
        }
        
        // 2. Aksi Tombol Simpan
        if (saveButton) {
             saveButton.onclick = async () => {
                 
                 const success = await this.saveDataToDatabase(null, { action: 'save_santri_classes' });
                 
                 let targetClassName = 'kelas yang dipilih';
                 if (filterSelect) {
                     const selectedOption = filterSelect.options[filterSelect.selectedIndex];
                     if (selectedOption.value !== 'semua') {
                          targetClassName = selectedOption.textContent;
                     }
                 }

                 if (success) {
                     const successMessage = `Data santri berhasil dipindahkan ke ${targetClassName}.`;
                     this.showNotification(successMessage, 'success');
                 } else {
                     const errorMessage = 'Gagal memindahkan data santri. Silakan coba lagi.';
                     this.showNotification(errorMessage, 'cancel');
                 }
             };
        }
        
        const backButtons = document.querySelectorAll('#back-to-dashboard');
        if (backButtons.length > 1) {
             for(let i = 0; i < backButtons.length - 1; i++) {
                 backButtons[i].remove();
             }
        }
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: Muat Konten Tambah Kelas *
    // **********************************************
    async loadTambahKelasContent() {
        // ... (Fungsi loadTambahKelasContent tetap sama) ...
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

            this.initTambahKelasActions();
            this.initBackButton('Dashboard');

            this.menuItems.forEach(i => i.classList.remove('active'));
            const dashboardItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Dashboard');
            if (dashboardItem) {
                dashboardItem.classList.add('active');
            }
            
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
        // ... (Fungsi initTambahKelasActions tetap sama) ...
        const btnTambahKelas = document.getElementById('btn-tambah-kelas');

        if (btnTambahKelas) {
            const newBtn = btnTambahKelas.cloneNode(true);
            btnTambahKelas.replaceWith(newBtn);
            
            newBtn.addEventListener('click', () => {
                this.showKelasModal();
            });
        }
        
        const tableBody = document.getElementById('kelas-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const row = target.closest('.table-data-row');
                const kelasNama = row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'Kelas Baru';
                
                if (target.classList.contains('btn-add-pengajar')) {
                    console.log(`[NAVIGASI] Mengarahkan ke Daftar Kelas Santri untuk Kelas ${kelasNama}`);
                    this.loadDaftarKelasSantriContent({ kelas: kelasNama });
                }
                else if (target.classList.contains('btn-delete-kelas')) {
                    if (confirm(`Anda yakin ingin menghapus kelas: ${kelasNama}?`)) {
                        row.remove();
                        this.showNotification(`Kelas ${kelasNama} berhasil dihapus (simulasi).`, 'cancel');
                    }
                }
            });
        }
        
        this.initKelasModalActions();
        this.initViewSiswaAction();
        this.initBackButton('Dashboard');
    }

    // **********************************************
    // * FUNGSI showKelasModal (DIPERTAHANKAN) *
    // **********************************************
    showKelasModal(kelasNama = 'Kelas Baru') {
        // ... (Fungsi showKelasModal tetap sama) ...
        const modal = document.getElementById('tambah-kelas-modal');
        const kelasInput = document.getElementById('kelas-tingkatan-popup');

        if (!modal) {
            console.error('Elemen modal dengan ID "tambah-kelas-modal" tidak ditemukan.');
            return;
        }
        
        if (kelasInput) kelasInput.value = (kelasNama === '-- Pilih Tingkatan --') ? '' : kelasNama;
        
        const form = document.getElementById('form-tambah-kelas');
        if (form) form.reset();
        
        modal.style.display = 'flex';
        console.log(`[MODAL] Modal Tambah Kelas ditampilkan.`);
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: initKelasModalActions (DIBUAT LEBIH STABIL & SESUAI ALUR BARU) *
    // **********************************************
    initKelasModalActions() {
        // ... (Fungsi initKelasModalActions tetap sama) ...
        const modal = document.getElementById('tambah-kelas-modal');
        if (!modal) return;
        
        const closeBtn = document.getElementById('close-kelas-modal');
        const form = document.getElementById('form-tambah-kelas');

        const closeModal = () => modal.style.display = 'none';

        
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const data = {
                    tingkatan: document.getElementById('kelas-tingkatan-popup').value,
                    pengajar: document.getElementById('pengajar-popup').value,
                    kapasitas: document.getElementById('kapasitas-popup').value,
                    kategori: document.getElementById('kategori-popup').value,
                    waktuAwal: document.getElementById('waktu-awal-popup').value,
                    waktuSelesai: document.getElementById('waktu-selesai-popup').value,
                };

                if (!data.tingkatan || !data.pengajar) {
                    this.showNotification('Kelas/Tingkatan dan Pengajar wajib diisi.', 'cancel');
                    return;
                }

                const success = await this.saveDataToDatabase(null, { action: 'add_class', data });
                
                closeModal();
                
                if (success) {
                    this.showNotification(`Kelas ${data.tingkatan} berhasil disimpan! Mengarahkan ke daftar santri...`, 'success');
                    
                    setTimeout(() => {
                        this.loadDaftarKelasSantriContent();
                    }, 500);
                    
                } else {
                    this.showNotification(`Gagal menyimpan kelas.`, 'cancel');
                }
            };
        }
        
        modal.onclick = (e) => {
             if (e.target === modal) {
                 closeModal();
             }
         };
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: INIT TOMBOL KEMBALI *
    // **********************************************
    initBackButton(previousPageTitle = 'Dashboard') {
        const backButtons = document.querySelectorAll('.back-btn, #back-to-dashboard'); // Termasuk .back-btn di Detail Santri/Pengajar
        
        // 1. Menghapus duplikasi tombol "Kembali"
        backButtons.forEach(btn => {
             // Hanya hapus tombol yang bukan merupakan tombol kembali standar di detail page
             if (btn.id === 'back-to-dashboard') {
                 const newBtn = btn.cloneNode(true);
                 btn.replaceWith(newBtn);
                 // Tambahkan listener ke tombol yang baru di-clone
                 newBtn.onclick = () => this.navigateBack(previousPageTitle);
             } else if (btn.classList.contains('back-btn')) {
                 // Tombol 'Kembali' yang ada di Detail Santri/Pengajar/dll
                 btn.onclick = () => this.navigateBack(previousPageTitle);
             }
        });
    }
    
    // **********************************************
    // * FUNGSI BARU: Logic Navigasi Kembali *
    // **********************************************
    navigateBack(previousPageTitle) {
        this.menuItems.forEach(i => i.classList.remove('active'));

        if (previousPageTitle === 'Daftar Pengajar') {
            const pengajarMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Pengajar');
            if (pengajarMenuItem) {
                this.loadContent('Daftar Pengajar', 'daftar_pengajar.html');
            } else {
                this.loadDashboardContent();
            }
        } else if (previousPageTitle === 'Daftar Santri') { // **LOGIKA BARU**
            const santriMenuItem = Array.from(this.menuItems).find(item => item.textContent.trim() === 'Daftar Santri');
            if (santriMenuItem) {
                this.loadDaftarSantriContent();
            } else {
                this.loadDashboardContent();
            }
        } else {
            this.loadDashboardContent();
        }
    }
    
    // **********************************************
    // * FUNGSI MODIFIKASI: MUAT KONTEN DETAIL PENGAJAR *
    // **********************************************
    async loadDetailPengajarContent(idPengajar) {
        // ... (Fungsi loadDetailPengajarContent tetap sama) ...
        if (!this.mainContent) return;

        this.currentPengajarId = idPengajar;
        
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
            
            const statusDisplayInput = document.getElementById('input-status-display');
            if(statusDisplayInput) {
                statusDisplayInput.value = currentStatusText;
                statusDisplayInput.style.backgroundColor = statusColor;
                statusDisplayInput.style.color = 'white';
            }

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
        // ... (Fungsi loadContent tetap sama) ...
        if (!this.mainContent) return;

        try {
            let htmlContent;
            let targetFilename = filename;

            if (pageTitle === 'Tambah Siswa') {
                targetFilename = 'tambah_siswa.html';
            } else if (pageTitle === 'Tambah Pengajar') {
                targetFilename = 'tambah_pengajar.html';
            } else if (pageTitle === 'Daftar Pengajar') {
                targetFilename = 'daftar_pengajar.html';
            } else if (pageTitle === 'Daftar Kelas') {
                return this.loadDaftarKelasSantriContent();
            } else if (pageTitle === 'Daftar Jadwal') {
                return this.loadDaftarJadwalContent();
            } else if (pageTitle === 'Daftar Santri') { // **LOGIKA BARU**
                return this.loadDaftarSantriContent();
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
            
            if (pageTitle === 'Daftar Pengajar') {
                this.initTableActions();
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
    
    // --- LISTENER INITIALIZATION ---

    // **********************************************
    // * FUNGSI MODIFIKASI: initMenuNavigation *
    // **********************************************
    initMenuNavigation() {
        // ... (Fungsi initMenuNavigation tetap sama) ...
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const menuText = item.textContent.trim();
                let filename = `${menuText.toLowerCase().replace(/\s/g, '_')}.html`;

                if (menuText === 'Dashboard') {
                    this.loadDashboardContent();
                } else if (menuText === 'Daftar Jadwal') {
                    this.loadDaftarJadwalContent();
                } else if (menuText === 'Daftar Kelas') {
                    this.loadDaftarKelasSantriContent();
                } else if (menuText === 'Daftar Santri') { // **LOGIKA BARU**
                    this.loadDaftarSantriContent();
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
        // ... (Fungsi initQuickActions tetap sama) ...
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(btn => {
            btn.onclick = () => {
                const btnText = btn.textContent.trim();

                if (btnText.includes('Tambah Siswa')) {
                    this.loadContent('Tambah Siswa', 'tambah_siswa.html', null);
                } else if (btnText.includes('Tambah Pengajar')) {
                    this.loadContent('Tambah Pengajar', 'tambah_pengajar.html', null);
                } else if (btnText.includes('Tambah Kelas')) {
                    this.loadTambahKelasContent();
                } else {
                    console.log(`[AKSI CEPAT] Tombol "${btnText}" diklik.`);
                }
            };
        });
    }

    // **********************************************
    // * FUNGSI MODIFIKASI: initTableActions *
    // **********************************************
    initTableActions() {
        // ... (Fungsi initTableActions tetap sama) ...
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

                const success = await this.saveDataToDatabase(idPengajar, { status: newStatus });

                if (success) {
                    this.togglePengajarStatus(newToggle, newStatus);
                } else {
                    this.showNotification("Gagal mengubah status di server.", 'cancel');
                }
            });
        });
    }
    
    initLogout() {
        // ... (Fungsi initLogout tetap sama) ...
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
        // ... (Fungsi initContentStatusActions tetap sama) ...
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
// 2. KELAS UTAMA: PROFILE MANAGER (Logika Pop-up dan Update Tabel)
// ====================================================================
class ProfileManager {
    constructor() {
        // ... (Konstruktor ProfileManager tetap sama) ...
        this.settingButton = document.querySelector('.footer-btn.setting');
        this.settingPopup = document.getElementById('popup-profile-setting');
        this.closeSettingPopupBtn = document.getElementById('close-setting-popup');
        this.cancelSettingPopupBtn = document.querySelector('.cancel-btn');
        
        this.saveButton = document.querySelector('#popup-profile-setting .save-btn');
        
        this.notificationToast = document.getElementById('notification-toast');
        this.detailPopup = document.getElementById('popup-detail-pendaftar');
        this.detailAcceptBtn = document.querySelector('.action-btn-popup.detail-diterima');
        this.detailRejectBtn = document.querySelector('.action-btn-popup.detail-ditolak');
        this.profileNameInput = document.getElementById('profile-name-input');
        
        this.adminIcon = document.getElementById('dashboard-admin-icon');
        this.miniProfileCard = document.getElementById('popup-profile-mini');
        this.dashboardAdminName = document.getElementById('dashboard-admin-name');
        this.miniCardName = document.getElementById('mini-card-name');
        this.profileAvatarLarge = document.querySelector('.profile-avatar-large');
        
        this.currentRow = null;
        this.currentProfile = { name: 'Rizka Sugiarto', email: 'admin@pesantren.com', phone: '0812-xxx-xxx' };

        this.rebindHeaderListeners();
        
        this.rebindSettingButton();

        this.initFormActions();
        this.initDetailPopupToggle();
        
        document.addEventListener('reInitProfileManager', () => this.rebindAllProfileActions());
    }
    
    // **********************************************
    // * FUNGSI BARU: Rebind Tombol Setting/Logout *
    // **********************************************
    rebindSettingButton() {
        // ... (Fungsi rebindSettingButton tetap sama) ...
        this.settingButton = document.querySelector('.footer-btn.setting');
        if (this.settingButton) {
            this.settingButton.onclick = (e) => {
                e.preventDefault();
                this.initSettingPopupToggle();
                this.openSettingPopup();
            }
        }
        
        this.logoutButton = document.querySelector('.footer-btn.logout');
        if (this.logoutButton) {
            this.logoutButton.onclick = (e) => {
                e.preventDefault();
                console.log("[LOGOUT] Proses keluar dijalankan. Mengarahkan ke halaman login...");
            }
        }
    }
    
    rebindAllProfileActions() {
        // ... (Fungsi rebindAllProfileActions tetap sama) ...
        this.rebindHeaderListeners();
        this.rebindSettingButton();
        this.initFormActions();
        console.log("[PROFILE MANAGER] Tombol Setting, Logout, dan Header diikat ulang.");
    }
    
    rebindHeaderListeners() {
        // ... (Fungsi rebindHeaderListeners tetap sama) ...
        this.adminIcon = document.getElementById('dashboard-admin-icon');
        this.miniProfileCard = document.getElementById('popup-profile-mini');
        this.dashboardAdminName = document.getElementById('dashboard-admin-name');
        this.miniCardName = document.getElementById('mini-card-name');

        if (!this.adminIcon || !this.miniProfileCard) return;

        const newAdminIcon = this.adminIcon.cloneNode(true);
        this.adminIcon.replaceWith(newAdminIcon);
        this.adminIcon = newAdminIcon;

        this.adminIcon.addEventListener('click', () => {
            const isVisible = this.miniProfileCard.style.display === 'block';
            this.miniProfileCard.style.display = isVisible ? 'none' : 'block';
        });
        
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
        // ... (Fungsi updateAvatars tetap sama) ...
        const nameParts = name.split(' ');
        const shortName = nameParts.length > 0 ? nameParts[0] : 'Admin';
        
        if (this.dashboardAdminName) this.dashboardAdminName.textContent = shortName;
        if (this.miniCardName) this.miniCardName.textContent = name;
        
        if (document.getElementById('mini-card-email')) document.getElementById('mini-card-email').textContent = this.currentProfile.email;
        
        const initials = this.getInitials(name);
        const miniAvatar = document.querySelector('.profile-avatar-mini');
        if (miniAvatar) {
            const img = miniAvatar.querySelector('img');
            if (!img) {
                miniAvatar.textContent = initials;
            }
        }
    }
    
    getInitials(name) {
        // ... (Fungsi getInitials tetap sama) ...
        if (!name) return 'R';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
        }
        return parts[0][0].toUpperCase();
    }
    
    // --- POPUP SETTING PROFILE ---
    
    initSettingPopupToggle() {
        // ... (Fungsi initSettingPopupToggle tetap sama) ...
        if (!this.settingPopup) return;
        
        if (this.closeSettingPopupBtn) {
            this.closeSettingPopupBtn.onclick = null;
            this.closeSettingPopupBtn.onclick = () => this.closeSettingPopup(false);
        }

        if (this.cancelSettingPopupBtn) {
            this.cancelSettingPopupBtn.onclick = null;
            this.cancelSettingPopupBtn.onclick = () => this.closeSettingPopup(true);
        }
        
        this.settingPopup.onclick = (e) => {
            if (e.target === this.settingPopup) {
                this.closeSettingPopup(false);
            }
        };
    }

    openSettingPopup() {
        // ... (Fungsi openSettingPopup tetap sama) ...
        if (this.settingPopup) {
            if (document.getElementById('profile-name-input')) document.getElementById('profile-name-input').value = this.currentProfile.name;
            if (document.getElementById('profile-email-input')) document.getElementById('profile-email-input').value = this.currentProfile.email;
            if (document.getElementById('profile-phone-input')) document.getElementById('profile-phone-input').value = this.currentProfile.phone;

            this.updateDisplayedInitials(this.currentProfile.name);

            this.settingPopup.style.display = 'flex';
        }
    }
    
    closeSettingPopup(notify = false) {
        // ... (Fungsi closeSettingPopup tetap sama) ...
        if (this.settingPopup) {
            this.settingPopup.style.display = 'none';
        }
        if (notify) {
            if (window.uiManager && window.uiManager.showNotification) {
                window.uiManager.showNotification('Pengaturan Profil Dibatalkan.', 'cancel');
            }
        }
    }

    // **********************************************
    // * PERBAIKAN: initFormActions (Mengatasi Konflik Form/Submit) *
    // **********************************************
    initFormActions() {
        // ... (Fungsi initFormActions tetap sama) ...
        this.saveButton = document.querySelector('#popup-profile-setting .save-btn');
        if (!this.saveButton) return;
        
        const newSaveButton = this.saveButton.cloneNode(true);
        this.saveButton.replaceWith(newSaveButton);
        this.saveButton = newSaveButton;
        
        this.saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSaveProfile();
        });
        
        this.profileNameInput = document.getElementById('profile-name-input');
        
        if (this.profileNameInput) {
            this.profileNameInput.addEventListener('input', (e) => this.updateDisplayedInitials(e.target.value));
        }
    }
    
    updateDisplayedInitials(name) {
        // ... (Fungsi updateDisplayedInitials tetap sama) ...
        const initials = this.getInitials(name);
        const profileAvatarLarge = document.querySelector('.profile-avatar-large');
        
        if (profileAvatarLarge) {
            const img = profileAvatarLarge.querySelector('img');
            if (!img) {
                profileAvatarLarge.textContent = initials;
            }
        }
    }

    // **********************************************
    // * PERBAIKAN: handleSaveProfile (Menggunakan UIManager untuk Notifikasi) *
    // **********************************************
    handleSaveProfile() {
        // ... (Fungsi handleSaveProfile tetap sama) ...
        const newName = document.getElementById('profile-name-input').value;
        const newEmail = document.getElementById('profile-email-input').value;
        const newPhone = document.getElementById('profile-phone-input').value;
        
        this.currentProfile.name = newName;
        this.currentProfile.email = newEmail;
        this.currentProfile.phone = newPhone;
        
        this.updateAvatars(this.currentProfile.name);
        this.closeSettingPopup(false);
        
        if (window.uiManager && window.uiManager.showNotification) {
            window.uiManager.showNotification('Profil Berhasil Diperbarui.', 'success');
        } else {
            console.log("Profil Berhasil Diperbarui (Notifikasi UIManager tidak tersedia).");
        }
    }

    // --- POPUP DETAIL PENDAFTAR ---
    
    initDetailPopupToggle() {
        // ... (Fungsi initDetailPopupToggle tetap sama) ...
        this.detailPopup = document.getElementById('popup-detail-pendaftar');
        if (!this.detailPopup) return;
        
        this.detailAcceptBtn = document.querySelector('.action-btn-popup.detail-diterima');
        this.detailRejectBtn = document.querySelector('.action-btn-popup.detail-ditolak');

        const closeDetailPopupBtn = document.getElementById('close-detail-popup');
        if (closeDetailPopupBtn) { closeDetailPopupBtn.addEventListener('click', () => this.closeDetailPopup(false)); }

        if (this.detailAcceptBtn) { this.detailAcceptBtn.addEventListener('click', () => this.handleAccept()); }
        if (this.detailRejectBtn) { this.detailRejectBtn.addEventListener('click', () => this.handleReject()); }
    }

    openDetailPopup(data) {
        // ... (Fungsi openDetailPopup tetap sama) ...
        if (!this.detailPopup) return;
        this.currentRow = data.rowElement || null;
        
        if (document.getElementById('detail-name')) document.getElementById('detail-name').textContent = data.nama || '-';
        this.detailPopup.style.display = 'flex';
    }

    closeDetailPopup(notify = false) {
        // ... (Fungsi closeDetailPopup tetap sama) ...
        if (this.detailPopup) {
            this.detailPopup.style.display = 'none';
            this.currentRow = null;
        }
    }

    updateTableRowStatus(status) {
        // ... (Fungsi updateTableRowStatus tetap sama) ...
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
        // ... (Fungsi handleAccept tetap sama) ...
        this.updateTableRowStatus('DITERIMA');
        this.closeDetailPopup();
    }
    
    handleReject() {
        // ... (Fungsi handleReject tetap sama) ...
        this.updateTableRowStatus('DITOLAK');
        this.closeDetailPopup();
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
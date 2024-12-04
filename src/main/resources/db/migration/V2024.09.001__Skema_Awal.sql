create table peserta (
    id varchar(36),
    nama varchar(255) not null,
    email varchar(50) not null,
    nomor_handphone varchar(50) not null,
    primary key (id),
    unique (email)
);

create table pengajar (
    id varchar(36),
    nama varchar(255) not null,
    email varchar(50) not null,
    nomor_handphone varchar(50) not null,
    primary key (id),
    unique (email)
);

create table kurikulum (
    id varchar(36),
    kode varchar(100) not null,
    nama varchar(200) not null,
    aktif boolean,
    primary key (id),
    unique (kode)
);

create table mata_pelajaran (
    id varchar(36),
    id_kurikulum varchar(36),
    kode varchar(100) not null,
    nama varchar(200) not null,
    aktif boolean,
    primary key (id),
    foreign key (id_kurikulum) references kurikulum(id)
);

create table kelas (
    id varchar(36),
    id_mata_pelajaran varchar(36) not null,
    id_pengajar varchar(36) not null,
    nama varchar(100) not null,
    hari varchar(10) not null,
    waktu_mulai time not null,
    waktu_selesai time not null,
    primary key (id),
    unique (nama),
    foreign key (id_mata_pelajaran) references mata_pelajaran(id),
    foreign key (id_pengajar) references pengajar(id)
);

create table peserta_kelas (
    id_peserta varchar(36),
    id_kelas varchar(36),
    primary key (id_peserta, id_kelas),
    foreign key (id_peserta) references peserta(id),
    foreign key (id_kelas) references kelas(id)
);

create table sesi_belajar (
    id varchar(36),
    id_kelas varchar(36) not null,
    waktu_mulai timestamp not null,
    waktu_selesai timestamp,
    isi_pelajaran text,
    primary key (id),
    foreign key (id_kelas) references kelas(id)
);

create table presensi_peserta (
    id varchar(36),
    id_sesi_belajar varchar(36) not null,
    id_peserta varchar(36) not null,
    waktu_datang timestamp,
    jenis_presensi varchar(20) not null,
    primary key (id),
    foreign key (id_sesi_belajar) references sesi_belajar(id),
    foreign key (id_peserta) references peserta(id)
);

create table presensi_pengajar (
    id varchar(36),
    id_sesi_belajar varchar(36) not null,
    id_pengajar varchar(36) not null,
    waktu_datang timestamp not null,
    primary key (id),
    foreign key (id_sesi_belajar) references sesi_belajar(id),
    foreign key (id_pengajar) references pengajar(id)
);

create table jurnal_mutabaah (
    id varchar(36),
    id_peserta varchar(36) not null,
    waktu_kegiatan timestamp not null,
    keterangan varchar(255) not null,
    primary key (id),
    foreign key (id_peserta) references peserta(id)
);

create table ujian (
    id varchar(36),
    id_mata_pelajaran varchar(36) not null,
    nama_ujian varchar(100) not null,
    primary key (id),
    foreign key (id_mata_pelajaran) references mata_pelajaran(id)
);

create table soal_ujian (
    id varchar(36),
    id_ujian varchar(36) not null,
    urutan integer not null,
    pertanyaan text not null,
    primary key (id),
    foreign key (id_ujian) references ujian(id)
);

create table sesi_ujian (
    id varchar(36),
    id_ujian varchar(36),
    waktu_mulai timestamp not null,
    waktu_selesai timestamp,
    primary key (id),
    foreign key (id_ujian) references ujian(id)
);

create table sesi_ujian_peserta (
    id varchar(36),
    id_peserta varchar(36),
    id_sesi_ujian varchar(36),
    waktu_datang timestamp not null,
    primary key (id),
    foreign key (id_peserta) references peserta(id),
    foreign key (id_sesi_ujian) references sesi_ujian(id)
);

create table sesi_ujian_pengajar (
    id varchar(36),
    id_pengajar varchar(36),
    id_sesi_ujian varchar(36),
    waktu_datang timestamp not null,
    primary key (id),
    foreign key (id_pengajar) references pengajar(id),
    foreign key (id_sesi_ujian) references sesi_ujian(id)
);

create table nilai_ujian (
    id varchar(36),
    id_sesi_ujian varchar(36),
    id_peserta varchar(36),
    nilai numeric(3,2) not null,
    keterangan varchar(255),
    primary key (id),
    foreign key (id_peserta) references peserta(id),
    foreign key (id_sesi_ujian) references sesi_ujian(id)
);

create table tagihan (
    id varchar(36),
    id_peserta varchar(36),
    tanggal_terbit date not null,
    tanggal_jatuh_tempo date not null,
    nilai numeric(19,2) not null,
    lunas boolean not null,
    primary key (id),
    foreign key (id_peserta) references peserta(id)
);

create table pembayaran_tagihan (
    id varchar(36),
    id_tagihan varchar(36) not null,
    waktu_pembayaran timestamp not null,
    nilai_pembayaran numeric(19,2) not null,
    kanal_pembayaran varchar(20) not null,
    referensi varchar(50) not null,
    primary key (id),
    foreign key (id_tagihan) references tagihan(id)
);

create table program_sedekah (
    id varchar(36),
    nama varchar(200) not null,
    deskripsi varchar(255),
    tanggal_mulai date not null,
    tanggal_selesai date not null,
    aktif boolean,
    primary key (id)
);

create table pembayaran_sedekah (
    id varchar(36),
    id_program_sedekah varchar(36) not null,
    id_peserta varchar(36),
    waktu_pembayaran timestamp not null,
    nilai_pembayaran numeric(19,2) not null,
    kanal_pembayaran varchar(20) not null,
    referensi varchar(50) not null,
    primary key (id),
    foreign key (id_program_sedekah) references program_sedekah(id),
    foreign key (id_peserta) references peserta(id)
);

create table event (
    id varchar(36),
    nama varchar(100) not null,
    waktu_kegiatan_rencana timestamp not null,
    waktu_kegiatan_realisasi timestamp,
    catatan_acara text,
    primary key (id)
);

create table event_kehadiran_peserta (
    id varchar(36),
    id_event varchar(36) not null,
    id_peserta varchar(36) not null,
    waktu_kehadiran timestamp not null,
    primary key (id),
    foreign key (id_event) references event(id),
    foreign key (id_peserta) references peserta(id)
);
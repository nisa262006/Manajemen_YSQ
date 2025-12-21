--
-- PostgreSQL database dump
--

\restrict bebO9jlAzPUepK03Nu5e8AdS2FJrZbMPbu8HbBxr0xp7e4ugOG8dUW3pwqzuEzs

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-20 15:04:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 16634)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16825)
-- Name: absensi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absensi (
    id_absensi integer NOT NULL,
    id_santri integer,
    id_jadwal integer,
    tanggal date NOT NULL,
    status_absensi character varying(10),
    catatan text,
    CONSTRAINT absensi_status_absensi_check CHECK (((status_absensi)::text = ANY ((ARRAY['Hadir'::character varying, 'Izin'::character varying, 'Sakit'::character varying, 'Alpha'::character varying, 'Mustamiah'::character varying])::text[])))
);


ALTER TABLE public.absensi OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16824)
-- Name: absensi_id_absensi_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absensi_id_absensi_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absensi_id_absensi_seq OWNER TO postgres;

--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 222
-- Name: absensi_id_absensi_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absensi_id_absensi_seq OWNED BY public.absensi.id_absensi;


--
-- TOC entry 225 (class 1259 OID 16845)
-- Name: absensi_pengajar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absensi_pengajar (
    id_absensi_pengajar integer NOT NULL,
    id_pengajar integer,
    id_jadwal integer,
    tanggal date NOT NULL,
    status_absensi character varying(10),
    catatan text,
    CONSTRAINT absensi_pengajar_status_absensi_check CHECK (((status_absensi)::text = ANY ((ARRAY['Hadir'::character varying, 'Izin'::character varying, 'Sakit'::character varying, 'Alpha'::character varying])::text[])))
);


ALTER TABLE public.absensi_pengajar OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16844)
-- Name: absensi_pengajar_id_absensi_pengajar_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absensi_pengajar_id_absensi_pengajar_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absensi_pengajar_id_absensi_pengajar_seq OWNER TO postgres;

--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 224
-- Name: absensi_pengajar_id_absensi_pengajar_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absensi_pengajar_id_absensi_pengajar_seq OWNED BY public.absensi_pengajar.id_absensi_pengajar;


--
-- TOC entry 237 (class 1259 OID 17216)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id_admin integer NOT NULL,
    nama character varying,
    email character varying,
    no_wa character varying,
    foto character varying,
    id_users integer
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17215)
-- Name: admin_id_admin_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_admin_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_admin_seq OWNER TO postgres;

--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 236
-- Name: admin_id_admin_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_admin_seq OWNED BY public.admin.id_admin;


--
-- TOC entry 221 (class 1259 OID 16813)
-- Name: jadwal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jadwal (
    id_jadwal integer NOT NULL,
    id_kelas integer,
    hari character varying(20) NOT NULL,
    jam_mulai time without time zone NOT NULL,
    jam_selesai time without time zone NOT NULL,
    kategori character varying(100),
    id_pengajar integer
);


ALTER TABLE public.jadwal OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16812)
-- Name: jadwal_id_jadwal_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jadwal_id_jadwal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jadwal_id_jadwal_seq OWNER TO postgres;

--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 220
-- Name: jadwal_id_jadwal_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jadwal_id_jadwal_seq OWNED BY public.jadwal.id_jadwal;


--
-- TOC entry 233 (class 1259 OID 16940)
-- Name: kelas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kelas (
    id_kelas integer NOT NULL,
    id_program integer,
    id_pengajar integer,
    nama_kelas character varying(100),
    kategori character varying(20) NOT NULL,
    kapasitas integer,
    status character varying(20) DEFAULT 'aktif'::character varying
);


ALTER TABLE public.kelas OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16939)
-- Name: kelas_id_kelas_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kelas_id_kelas_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kelas_id_kelas_seq OWNER TO postgres;

--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 232
-- Name: kelas_id_kelas_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kelas_id_kelas_seq OWNED BY public.kelas.id_kelas;


--
-- TOC entry 239 (class 1259 OID 17232)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    id_users integer,
    token character varying(255),
    expired_at timestamp without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17231)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 238
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- TOC entry 231 (class 1259 OID 16930)
-- Name: pendaftar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pendaftar (
    id_pendaftar integer NOT NULL,
    nama character varying(255) NOT NULL,
    tempat_lahir character varying(100),
    tanggal_lahir date,
    email character varying(255),
    no_wa character varying(20),
    status character varying(20) DEFAULT 'menunggu'::character varying,
    id_users integer,
    alamat text
);


ALTER TABLE public.pendaftar OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16929)
-- Name: pendaftar_id_pendaftar_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pendaftar_id_pendaftar_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pendaftar_id_pendaftar_seq OWNER TO postgres;

--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 230
-- Name: pendaftar_id_pendaftar_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pendaftar_id_pendaftar_seq OWNED BY public.pendaftar.id_pendaftar;


--
-- TOC entry 235 (class 1259 OID 17189)
-- Name: pengajar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajar (
    id_pengajar integer NOT NULL,
    id_users integer,
    nama character varying(255) NOT NULL,
    no_kontak character varying(30),
    alamat text,
    status character varying(20) DEFAULT 'aktif'::character varying,
    tempat_lahir character varying(150),
    tanggal_lahir date,
    mapel character varying(255),
    email character varying(255),
    nip character varying(50),
    tanggal_terdaftar character varying(255)
);


ALTER TABLE public.pengajar OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17188)
-- Name: pengajar_id_pengajar_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajar_id_pengajar_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajar_id_pengajar_seq OWNER TO postgres;

--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 234
-- Name: pengajar_id_pengajar_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajar_id_pengajar_seq OWNED BY public.pengajar.id_pengajar;


--
-- TOC entry 227 (class 1259 OID 16866)
-- Name: program; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program (
    id_program integer NOT NULL,
    nama_program character varying(100) NOT NULL,
    deskripsi text
);


ALTER TABLE public.program OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16865)
-- Name: program_id_program_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.program_id_program_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.program_id_program_seq OWNER TO postgres;

--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 226
-- Name: program_id_program_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.program_id_program_seq OWNED BY public.program.id_program;


--
-- TOC entry 229 (class 1259 OID 16913)
-- Name: santri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.santri (
    id_santri integer NOT NULL,
    id_users integer,
    nis character varying(50),
    nama character varying(255) NOT NULL,
    kategori character varying(20) NOT NULL,
    no_wa character varying(20),
    email character varying(255),
    tempat_lahir character varying(100),
    tanggal_lahir date,
    status character varying(20) DEFAULT 'aktif'::character varying,
    alamat text,
    tanggal_terdaftar character varying(255)
);


ALTER TABLE public.santri OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16912)
-- Name: santri_id_santri_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.santri_id_santri_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.santri_id_santri_seq OWNER TO postgres;

--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 228
-- Name: santri_id_santri_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.santri_id_santri_seq OWNED BY public.santri.id_santri;


--
-- TOC entry 217 (class 1259 OID 16711)
-- Name: santri_kelas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.santri_kelas (
    id_santri integer NOT NULL,
    id_kelas integer NOT NULL,
    tgl_gabung date DEFAULT CURRENT_DATE
);


ALTER TABLE public.santri_kelas OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16755)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id_users integer NOT NULL,
    email character varying(150),
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    status_user character varying(20) DEFAULT 'aktif'::character varying,
    username character varying(255),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'staf'::character varying, 'pengajar'::character varying, 'santri'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16754)
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_user_seq OWNER TO postgres;

--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_users;


--
-- TOC entry 4800 (class 2604 OID 16828)
-- Name: absensi id_absensi; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi ALTER COLUMN id_absensi SET DEFAULT nextval('public.absensi_id_absensi_seq'::regclass);


--
-- TOC entry 4801 (class 2604 OID 16848)
-- Name: absensi_pengajar id_absensi_pengajar; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi_pengajar ALTER COLUMN id_absensi_pengajar SET DEFAULT nextval('public.absensi_pengajar_id_absensi_pengajar_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 17219)
-- Name: admin id_admin; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id_admin SET DEFAULT nextval('public.admin_id_admin_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 16816)
-- Name: jadwal id_jadwal; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal ALTER COLUMN id_jadwal SET DEFAULT nextval('public.jadwal_id_jadwal_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 16943)
-- Name: kelas id_kelas; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kelas ALTER COLUMN id_kelas SET DEFAULT nextval('public.kelas_id_kelas_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 17235)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 16933)
-- Name: pendaftar id_pendaftar; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pendaftar ALTER COLUMN id_pendaftar SET DEFAULT nextval('public.pendaftar_id_pendaftar_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 17192)
-- Name: pengajar id_pengajar; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajar ALTER COLUMN id_pengajar SET DEFAULT nextval('public.pengajar_id_pengajar_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 16869)
-- Name: program id_program; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program ALTER COLUMN id_program SET DEFAULT nextval('public.program_id_program_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16916)
-- Name: santri id_santri; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.santri ALTER COLUMN id_santri SET DEFAULT nextval('public.santri_id_santri_seq'::regclass);


--
-- TOC entry 4797 (class 2604 OID 16758)
-- Name: users id_users; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id_users SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- TOC entry 4831 (class 2606 OID 16853)
-- Name: absensi_pengajar absensi_pengajar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi_pengajar
    ADD CONSTRAINT absensi_pengajar_pkey PRIMARY KEY (id_absensi_pengajar);


--
-- TOC entry 4829 (class 2606 OID 16833)
-- Name: absensi absensi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_pkey PRIMARY KEY (id_absensi);


--
-- TOC entry 4847 (class 2606 OID 17225)
-- Name: admin admin_id_users_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_id_users_key UNIQUE (id_users);


--
-- TOC entry 4849 (class 2606 OID 17223)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id_admin);


--
-- TOC entry 4827 (class 2606 OID 16818)
-- Name: jadwal jadwal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal
    ADD CONSTRAINT jadwal_pkey PRIMARY KEY (id_jadwal);


--
-- TOC entry 4841 (class 2606 OID 16946)
-- Name: kelas kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kelas
    ADD CONSTRAINT kelas_pkey PRIMARY KEY (id_kelas);


--
-- TOC entry 4851 (class 2606 OID 17237)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 2606 OID 17239)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 4839 (class 2606 OID 16938)
-- Name: pendaftar pendaftar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pendaftar
    ADD CONSTRAINT pendaftar_pkey PRIMARY KEY (id_pendaftar);


--
-- TOC entry 4843 (class 2606 OID 17199)
-- Name: pengajar pengajar_id_users_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajar
    ADD CONSTRAINT pengajar_id_users_key UNIQUE (id_users);


--
-- TOC entry 4845 (class 2606 OID 17197)
-- Name: pengajar pengajar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajar
    ADD CONSTRAINT pengajar_pkey PRIMARY KEY (id_pengajar);


--
-- TOC entry 4833 (class 2606 OID 16871)
-- Name: program program_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program
    ADD CONSTRAINT program_pkey PRIMARY KEY (id_program);


--
-- TOC entry 4817 (class 2606 OID 16716)
-- Name: santri_kelas santri_kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.santri_kelas
    ADD CONSTRAINT santri_kelas_pkey PRIMARY KEY (id_santri, id_kelas);


--
-- TOC entry 4835 (class 2606 OID 16923)
-- Name: santri santri_nis_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_nis_key UNIQUE (nis);


--
-- TOC entry 4837 (class 2606 OID 16921)
-- Name: santri santri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_pkey PRIMARY KEY (id_santri);


--
-- TOC entry 4819 (class 2606 OID 17253)
-- Name: users unique_username; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_username UNIQUE (username);


--
-- TOC entry 4821 (class 2606 OID 16764)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4823 (class 2606 OID 16762)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_users);


--
-- TOC entry 4825 (class 2606 OID 17207)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4855 (class 2606 OID 16839)
-- Name: absensi absensi_id_jadwal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_id_jadwal_fkey FOREIGN KEY (id_jadwal) REFERENCES public.jadwal(id_jadwal);


--
-- TOC entry 4856 (class 2606 OID 16859)
-- Name: absensi_pengajar absensi_pengajar_id_jadwal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi_pengajar
    ADD CONSTRAINT absensi_pengajar_id_jadwal_fkey FOREIGN KEY (id_jadwal) REFERENCES public.jadwal(id_jadwal);


--
-- TOC entry 4860 (class 2606 OID 17226)
-- Name: admin admin_id_users_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_id_users_fkey FOREIGN KEY (id_users) REFERENCES public.users(id_users) ON DELETE CASCADE;


--
-- TOC entry 4854 (class 2606 OID 17210)
-- Name: jadwal jadwal_id_pengajar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal
    ADD CONSTRAINT jadwal_id_pengajar_fkey FOREIGN KEY (id_pengajar) REFERENCES public.pengajar(id_pengajar);


--
-- TOC entry 4858 (class 2606 OID 16947)
-- Name: kelas kelas_id_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kelas
    ADD CONSTRAINT kelas_id_program_fkey FOREIGN KEY (id_program) REFERENCES public.program(id_program);


--
-- TOC entry 4861 (class 2606 OID 17240)
-- Name: password_reset_tokens password_reset_tokens_id_users_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_id_users_fkey FOREIGN KEY (id_users) REFERENCES public.users(id_users) ON DELETE CASCADE;


--
-- TOC entry 4859 (class 2606 OID 17200)
-- Name: pengajar pengajar_id_users_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajar
    ADD CONSTRAINT pengajar_id_users_fkey FOREIGN KEY (id_users) REFERENCES public.users(id_users);


--
-- TOC entry 4857 (class 2606 OID 16924)
-- Name: santri santri_id_users_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_id_users_fkey FOREIGN KEY (id_users) REFERENCES public.users(id_users) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2025-12-20 15:04:44

--
-- PostgreSQL database dump complete
--

\unrestrict bebO9jlAzPUepK03Nu5e8AdS2FJrZbMPbu8HbBxr0xp7e4ugOG8dUW3pwqzuEzs


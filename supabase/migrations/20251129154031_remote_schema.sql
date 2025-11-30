DROP TABLE IF EXISTS public.kv_store_e0d9c111 CASCADE;


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."kv_store_e0d9c111" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."kv_store_e0d9c111" OWNER TO "postgres";


ALTER TABLE ONLY "public"."kv_store_e0d9c111"
    ADD CONSTRAINT "kv_store_e0d9c111_pkey" PRIMARY KEY ("key");



CREATE INDEX "kv_store_e0d9c111_key_idx" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx1" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx10" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx11" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx12" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx13" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx14" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx15" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx16" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx2" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx3" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx4" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx5" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx6" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx7" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx8" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_e0d9c111_key_idx9" ON "public"."kv_store_e0d9c111" USING "btree" ("key" "text_pattern_ops");



ALTER TABLE "public"."kv_store_e0d9c111" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."kv_store_e0d9c111" TO "anon";
GRANT ALL ON TABLE "public"."kv_store_e0d9c111" TO "authenticated";
GRANT ALL ON TABLE "public"."kv_store_e0d9c111" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";



-- Run in Supabase SQL Editor.
-- Adds three contextual employment detail columns to members.

alter table members add column if not exists job_title text default '';
alter table members add column if not exists study_field text default '';
alter table members add column if not exists school_grade text default '';

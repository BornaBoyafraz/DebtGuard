-- =============================================================
-- Security Hardening Migration
-- Replaces permissive "for all" RLS policies with explicit
-- per-operation policies that include WITH CHECK clauses.
-- Also adds data-integrity constraints on sensitive columns.
-- =============================================================

-- ── financial_profiles ────────────────────────────────────────────────────

drop policy if exists "Users can manage own financial profile" on public.financial_profiles;

create policy "financial_profiles: select own"
  on public.financial_profiles for select
  using (auth.uid() = user_id);

create policy "financial_profiles: insert own"
  on public.financial_profiles for insert
  with check (auth.uid() = user_id);

create policy "financial_profiles: update own"
  on public.financial_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "financial_profiles: delete own"
  on public.financial_profiles for delete
  using (auth.uid() = user_id);

-- ── simulations ───────────────────────────────────────────────────────────

drop policy if exists "Users can manage own simulations" on public.simulations;

create policy "simulations: select own"
  on public.simulations for select
  using (auth.uid() = user_id);

create policy "simulations: insert own"
  on public.simulations for insert
  with check (auth.uid() = user_id);

create policy "simulations: update own"
  on public.simulations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "simulations: delete own"
  on public.simulations for delete
  using (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────────────────────

drop policy if exists "Users can manage own chat messages" on public.chat_messages;

create policy "chat_messages: select own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "chat_messages: insert own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "chat_messages: delete own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- chat_messages: no update policy — messages are immutable once written

-- ── ai_analyses ───────────────────────────────────────────────────────────

drop policy if exists "Users can manage own AI analyses" on public.ai_analyses;

create policy "ai_analyses: select own"
  on public.ai_analyses for select
  using (auth.uid() = user_id);

create policy "ai_analyses: insert own"
  on public.ai_analyses for insert
  with check (auth.uid() = user_id);

create policy "ai_analyses: delete own"
  on public.ai_analyses for delete
  using (auth.uid() = user_id);

-- ai_analyses: no update policy — cached analyses are immutable

-- ── Data integrity constraints ────────────────────────────────────────────

-- Constrain session_id length to match API validation (max 64 chars, alphanumeric+dash)
alter table public.chat_messages
  add constraint if not exists chat_messages_session_id_length
    check (length(session_id) between 1 and 64);

-- Constrain role to allowed values (already exists as inline check, belt+suspenders)
-- alter table public.chat_messages
--   add constraint if not exists chat_messages_role_values
--     check (role in ('user', 'assistant'));

-- Constrain content length to prevent bulk inserts with huge payloads (4000 chars max)
alter table public.chat_messages
  add constraint if not exists chat_messages_content_length
    check (length(content) <= 4000);

-- Constrain analysis_type to known values
alter table public.ai_analyses
  add constraint if not exists ai_analyses_type_values
    check (analysis_type in ('risk', 'simulation'));

-- Constrain prompt_hash length (32-char hex from our SHA-256 truncation)
alter table public.ai_analyses
  add constraint if not exists ai_analyses_hash_length
    check (length(prompt_hash) between 1 and 64);

-- Constrain simulation label length
alter table public.simulations
  add constraint if not exists simulations_label_length
    check (length(label) between 1 and 200);

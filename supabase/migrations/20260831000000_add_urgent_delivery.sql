-- Urgent delivery — buyer can pay a surcharge at checkout for priority dispatch.
-- Flag + fee are persisted on the order so pricing survives page reloads and can't be
-- spoofed by the client at payment time (create-intent already prices off total_amount,
-- which includes the surcharge).

alter table orders
  add column is_urgent boolean not null default false,
  add column urgent_fee numeric not null default 0 check (urgent_fee >= 0);

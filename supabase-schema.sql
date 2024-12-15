-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create devices table if it doesn't exist
create table if not exists public.devices (
    id serial primary key,
    name varchar(255) not null,
    location varchar(255),
    part_number varchar(50),
    serial_number varchar(50) unique,
    ice_alert_serial varchar(50) unique,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create readings table if it doesn't exist
create table if not exists public.readings (
    id serial primary key,
    device_id integer references public.devices(id),
    temperature decimal(5,2),
    humidity decimal(5,2),
    flow_rate decimal(5,2),
    timestamp timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create alert_settings table if it doesn't exist
create table if not exists public.alert_settings (
    id serial primary key,
    device_id integer references public.devices(id) unique,
    enabled boolean default false,
    recipients jsonb default '[]'::jsonb,
    conditions jsonb default '{
        "temperature": {
            "enabled": false,
            "outOfRange": false,
            "threshold": false,
            "thresholdValue": 25,
            "frequency": "immediate"
        },
        "humidity": {
            "enabled": false,
            "outOfRange": false,
            "threshold": false,
            "thresholdValue": 50,
            "frequency": "immediate"
        },
        "flowRate": {
            "enabled": false,
            "outOfRange": false,
            "noFlow": false,
            "noFlowDuration": 5,
            "frequency": "immediate"
        }
    }'::jsonb,
    combination_alerts jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create alert_history table if it doesn't exist
create table if not exists public.alert_history (
    id serial primary key,
    device_id integer references public.devices(id),
    alert_type varchar(50) not null,
    message text not null,
    value decimal(10,2),
    threshold varchar(50),
    sent_at timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create latest_readings view
create or replace view public.latest_readings as
select distinct on (device_id)
    r.id,
    r.device_id,
    r.temperature,
    r.humidity,
    r.flow_rate,
    r.timestamp,
    r.created_at
from public.readings r
order by device_id, timestamp desc;

-- Add indexes
create index if not exists idx_readings_device_id on public.readings(device_id);
create index if not exists idx_readings_timestamp on public.readings(timestamp);
create index if not exists idx_alert_history_device_id on public.alert_history(device_id);
create index if not exists idx_alert_history_sent_at on public.alert_history(sent_at);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Add triggers
drop trigger if exists update_devices_updated_at on public.devices;
create trigger update_devices_updated_at
    before update on public.devices
    for each row
    execute function public.update_updated_at_column();

drop trigger if exists update_alert_settings_updated_at on public.alert_settings;
create trigger update_alert_settings_updated_at
    before update on public.alert_settings
    for each row
    execute function public.update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.alert_settings enable row level security;
alter table public.alert_history enable row level security;

-- Drop existing policies
drop policy if exists "Enable read access for all users" on public.devices;
drop policy if exists "Enable read access for all users" on public.readings;
drop policy if exists "Enable read access for all users" on public.alert_settings;
drop policy if exists "Enable read access for all users" on public.alert_history;
drop policy if exists "Enable insert for authenticated users only" on public.devices;
drop policy if exists "Enable insert for authenticated users only" on public.readings;
drop policy if exists "Enable insert/update for authenticated users only" on public.alert_settings;
drop policy if exists "Enable insert for authenticated users only" on public.alert_history;

-- Create policies
create policy "Enable read access for all users" on public.devices
    for select using (true);

create policy "Enable read access for all users" on public.readings
    for select using (true);

create policy "Enable read access for all users" on public.alert_settings
    for select using (true);

create policy "Enable read access for all users" on public.alert_history
    for select using (true);

create policy "Enable insert for authenticated users only" on public.devices
    for insert with check (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users only" on public.readings
    for insert with check (auth.role() = 'authenticated');

create policy "Enable insert/update for authenticated users only" on public.alert_settings
    for all using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users only" on public.alert_history
    for insert with check (auth.role() = 'authenticated');

-- Add combination_alerts column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_settings' 
        AND column_name = 'combination_alerts'
    ) THEN
        ALTER TABLE public.alert_settings 
        ADD COLUMN combination_alerts jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$; 
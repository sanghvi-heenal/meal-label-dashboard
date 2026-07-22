
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg integer,
  ADD COLUMN IF NOT EXISTS bmi numeric,
  ADD COLUMN IF NOT EXISTS diet_type text,
  ADD COLUMN IF NOT EXISTS calorie_target integer,
  ADD COLUMN IF NOT EXISTS protein_target integer,
  ADD COLUMN IF NOT EXISTS carbs_target integer,
  ADD COLUMN IF NOT EXISTS fat_target integer,
  ADD COLUMN IF NOT EXISTS fiber_target integer,
  ADD COLUMN IF NOT EXISTS sodium_target integer,
  ADD COLUMN IF NOT EXISTS sugar_target integer,
  ADD COLUMN IF NOT EXISTS sat_fat_target integer,
  ADD COLUMN IF NOT EXISTS hydration_target integer,
  ADD COLUMN IF NOT EXISTS hydration_unit text,
  ADD COLUMN IF NOT EXISTS current_hydration_ml integer,
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean,
  ADD COLUMN IF NOT EXISTS reminder_times jsonb,
  ADD COLUMN IF NOT EXISTS goals text[],
  ADD COLUMN IF NOT EXISTS log_prefs text[],
  ADD COLUMN IF NOT EXISTS pain_points text[],
  ADD COLUMN IF NOT EXISTS app_jobs text[],
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS allergies text[],
  ADD COLUMN IF NOT EXISTS custom_allergies text[],
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

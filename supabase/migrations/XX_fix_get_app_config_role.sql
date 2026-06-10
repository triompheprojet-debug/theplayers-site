CREATE OR REPLACE FUNCTION public.get_app_config(p_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_value jsonb;
  v_is_secret boolean;
  v_role text;
BEGIN
  SELECT value, is_secret INTO v_value, v_is_secret FROM app_config WHERE key = p_key;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    nullif(current_setting('request.jwt.claim.role', true), '')
  );
  IF v_is_secret AND v_role IS DISTINCT FROM 'service_role' THEN RETURN NULL; END IF;
  RETURN v_value;
END;
$function$;
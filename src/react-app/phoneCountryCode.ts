import {
  CALLING_CODE_BY_ISO,
  DEFAULT_PHONE_COUNTRY_CODE,
  callingCodeFromIso,
} from "@/callingCodes";
import { countryIsoFromLocation } from "@/countryUtils";

export { CALLING_CODE_BY_ISO, DEFAULT_PHONE_COUNTRY_CODE, callingCodeFromIso };

/** Default calling code from a profile location like "Brighton, United Kingdom". */
export function phoneCountryCodeFromLocation(
  location: string,
  fallback: string = DEFAULT_PHONE_COUNTRY_CODE,
) {
  return callingCodeFromIso(countryIsoFromLocation(location)) ?? fallback;
}

/**
 * Prefer an explicit code once a national number exists; otherwise derive from location.
 */
export function resolvePhoneCountryCode(options: {
  location: string;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
}) {
  const phoneNumber = options.phoneNumber?.trim() ?? "";
  if (phoneNumber) {
    return options.phoneCountryCode?.trim() || DEFAULT_PHONE_COUNTRY_CODE;
  }
  return phoneCountryCodeFromLocation(
    options.location,
    options.phoneCountryCode?.trim() || DEFAULT_PHONE_COUNTRY_CODE,
  );
}

import countries from 'i18n-iso-countries';
import enjson from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enjson);
export const countryObject = countries.getNames('en', { select: 'official' });

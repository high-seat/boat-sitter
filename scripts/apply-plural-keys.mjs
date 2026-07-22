import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function applyReplacements(filePath, replacements) {
  let source = readFileSync(filePath, "utf8");
  for (const [from, to] of replacements) {
    if (!source.includes(from)) {
      throw new Error(`Missing expected snippet in ${filePath}:\n${from}`);
    }
    source = source.replaceAll(from, to);
  }
  writeFileSync(filePath, source);
}

const localeExtrasReplacements = [
  // en-US / en-GB
  [
    '    "detail.ownerReviews": "{{count}} owner reviews",',
    `    "detail.ownerReviews_one": "1 owner review",
    "detail.ownerReviews_other": "{{count}} owner reviews",`,
  ],
  [
    '    "detail.applicants": "{{count}} sitters have applied · No nightly fee",',
    `    "detail.applicants_one": "1 sitter has applied · No nightly fee",
    "detail.applicants_other": "{{count}} sitters have applied · No nightly fee",`,
  ],
  [
    '    "duration.nights": "{{count}} nights",',
    `    "duration.nights_one": "1 night",
    "duration.nights_other": "{{count}} nights",`,
  ],
  [
    '    "member.reviews": "{{count}} reviews",',
    `    "member.reviews_one": "1 review",
    "member.reviews_other": "{{count}} reviews",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} sits as owner",',
    `    "member.sitsAsOwner_one": "1 sit as owner",
    "member.sitsAsOwner_other": "{{count}} sits as owner",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} sits as sitter",',
    `    "member.sitsAsSitter_one": "1 sit as sitter",
    "member.sitsAsSitter_other": "{{count}} sits as sitter",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} sit periods",',
    `    "owner.sitPeriods_one": "1 sit period",
    "owner.sitPeriods_other": "{{count}} sit periods",`,
  ],
  // fr
  [
    '    "detail.ownerReviews": "Avis des propriétaires du {{count}}",',
    `    "detail.ownerReviews_one": "1 avis de propriétaire",
    "detail.ownerReviews_other": "{{count}} avis de propriétaires",`,
  ],
  [
    '    "detail.applicants": "{{count}} gardiens ont postulé · Aucun frais par nuit",',
    `    "detail.applicants_one": "1 gardien a postulé · Aucun frais par nuit",
    "detail.applicants_other": "{{count}} gardiens ont postulé · Aucun frais par nuit",`,
  ],
  [
    '    "duration.nights": "{{count}} nuits",',
    `    "duration.nights_one": "1 nuit",
    "duration.nights_other": "{{count}} nuits",`,
  ],
  [
    '    "member.reviews": "Avis sur {{count}}",',
    `    "member.reviews_one": "1 avis",
    "member.reviews_other": "{{count}} avis",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} siège en tant que propriétaire",',
    `    "member.sitsAsOwner_one": "1 garde en tant que propriétaire",
    "member.sitsAsOwner_other": "{{count}} gardes en tant que propriétaire",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} est assis en tant que gardienne",',
    `    "member.sitsAsSitter_one": "1 garde en tant que gardien",
    "member.sitsAsSitter_other": "{{count}} gardes en tant que gardien",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} périodes de garde",',
    `    "owner.sitPeriods_one": "1 période de garde",
    "owner.sitPeriods_other": "{{count}} périodes de garde",`,
  ],
  // es
  [
    '    "detail.ownerReviews": "Opiniones de propietarios de {{count}}",',
    `    "detail.ownerReviews_one": "1 opinión de propietario",
    "detail.ownerReviews_other": "{{count}} opiniones de propietarios",`,
  ],
  [
    '    "detail.applicants": "Se han aplicado niñeras {{count}} · Sin cargo por noche",',
    `    "detail.applicants_one": "1 cuidador se ha postulado · Sin cargo por noche",
    "detail.applicants_other": "{{count}} cuidadores se han postulado · Sin cargo por noche",`,
  ],
  [
    '    "duration.nights": "{{count}} noches",',
    `    "duration.nights_one": "1 noche",
    "duration.nights_other": "{{count}} noches",`,
  ],
  [
    '    "member.reviews": "Opiniones sobre {{count}}",',
    `    "member.reviews_one": "1 opinión",
    "member.reviews_other": "{{count}} opiniones",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} se sienta como propietario",',
    `    "member.sitsAsOwner_one": "1 guarda como propietario",
    "member.sitsAsOwner_other": "{{count}} guardas como propietario",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} se sienta como niñera",',
    `    "member.sitsAsSitter_one": "1 guarda como cuidador",
    "member.sitsAsSitter_other": "{{count}} guardas como cuidador",`,
  ],
  [
    '    "owner.sitPeriods": "Períodos de sentado {{count}}",',
    `    "owner.sitPeriods_one": "1 período de guarda",
    "owner.sitPeriods_other": "{{count}} períodos de guarda",`,
  ],
  // it
  [
    '    "detail.ownerReviews": "Recensioni dei proprietari di {{count}}",',
    `    "detail.ownerReviews_one": "1 recensione del proprietario",
    "detail.ownerReviews_other": "{{count}} recensioni dei proprietari",`,
  ],
  [
    '    "detail.applicants": "Hanno fatto domanda i sitter {{count}} · Nessuna tariffa notturna",',
    `    "detail.applicants_one": "1 sitter ha fatto domanda · Nessuna tariffa notturna",
    "detail.applicants_other": "{{count}} sitter hanno fatto domanda · Nessuna tariffa notturna",`,
  ],
  [
    '    "duration.nights": "Notti {{count}}",',
    `    "duration.nights_one": "1 notte",
    "duration.nights_other": "{{count}} notti",`,
  ],
  [
    '    "member.reviews": "Recensioni {{count}}",',
    `    "member.reviews_one": "1 recensione",
    "member.reviews_other": "{{count}} recensioni",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} è il proprietario",',
    `    "member.sitsAsOwner_one": "1 custodia come proprietario",
    "member.sitsAsOwner_other": "{{count}} custodie come proprietario",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} siede come sitter",',
    `    "member.sitsAsSitter_one": "1 custodia come sitter",
    "member.sitsAsSitter_other": "{{count}} custodie come sitter",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} periodi di seduta",',
    `    "owner.sitPeriods_one": "1 periodo di custodia",
    "owner.sitPeriods_other": "{{count}} periodi di custodia",`,
  ],
  // de
  [
    '    "detail.ownerReviews": "{{count}}-Besitzerbewertungen",',
    `    "detail.ownerReviews_one": "1 Besitzerbewertung",
    "detail.ownerReviews_other": "{{count}} Besitzerbewertungen",`,
  ],
  [
    '    "detail.applicants": "{{count}}-Sitter haben sich beworben · Keine Gebühr pro Nacht",',
    `    "detail.applicants_one": "1 Sitter hat sich beworben · Keine Gebühr pro Nacht",
    "detail.applicants_other": "{{count}} Sitter haben sich beworben · Keine Gebühr pro Nacht",`,
  ],
  [
    '    "duration.nights": "{{count}} Nächte",',
    `    "duration.nights_one": "1 Nacht",
    "duration.nights_other": "{{count}} Nächte",`,
  ],
  [
    '    "member.reviews": "{{count}}-Bewertungen",',
    `    "member.reviews_one": "1 Bewertung",
    "member.reviews_other": "{{count}} Bewertungen",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} fungiert als Eigentümer",',
    `    "member.sitsAsOwner_one": "1 Aufenthalt als Eigentümer",
    "member.sitsAsOwner_other": "{{count}} Aufenthalte als Eigentümer",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} sitzt als Sitter",',
    `    "member.sitsAsSitter_one": "1 Aufenthalt als Sitter",
    "member.sitsAsSitter_other": "{{count}} Aufenthalte als Sitter",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} Sitzungsperioden",',
    `    "owner.sitPeriods_one": "1 Aufenthaltszeitraum",
    "owner.sitPeriods_other": "{{count}} Aufenthaltszeiträume",`,
  ],
  // nl
  [
    '    "detail.ownerReviews": "{{count}}-beoordelingen van eigenaren",',
    `    "detail.ownerReviews_one": "1 beoordeling van eigenaar",
    "detail.ownerReviews_other": "{{count}} beoordelingen van eigenaren",`,
  ],
  [
    '    "detail.applicants": "{{count}}-sitters hebben zich aangemeld · Geen nachttarief",',
    `    "detail.applicants_one": "1 sitter heeft zich aangemeld · Geen nachttarief",
    "detail.applicants_other": "{{count}} sitters hebben zich aangemeld · Geen nachttarief",`,
  ],
  [
    '    "duration.nights": "{{count}}-nachten",',
    `    "duration.nights_one": "1 nacht",
    "duration.nights_other": "{{count}} nachten",`,
  ],
  [
    '    "member.reviews": "{{count}} beoordelingen",',
    `    "member.reviews_one": "1 beoordeling",
    "member.reviews_other": "{{count}} beoordelingen",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} is eigenaar",',
    `    "member.sitsAsOwner_one": "1 verblijf als eigenaar",
    "member.sitsAsOwner_other": "{{count}} verblijven als eigenaar",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} zit als oppas",',
    `    "member.sitsAsSitter_one": "1 verblijf als oppas",
    "member.sitsAsSitter_other": "{{count}} verblijven als oppas",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} zitperiodes",',
    `    "owner.sitPeriods_one": "1 zitperiode",
    "owner.sitPeriods_other": "{{count}} zitperiodes",`,
  ],
  // pt
  [
    '    "detail.ownerReviews": "Comentários do proprietário do {{count}}",',
    `    "detail.ownerReviews_one": "1 avaliação de proprietário",
    "detail.ownerReviews_other": "{{count}} avaliações de proprietários",`,
  ],
  [
    '    "detail.applicants": "Os assistentes {{count}} se inscreveram · Sem taxa noturna",',
    `    "detail.applicants_one": "1 sitter candidatou-se · Sem taxa noturna",
    "detail.applicants_other": "{{count}} sitters candidataram-se · Sem taxa noturna",`,
  ],
  [
    '    "duration.nights": "Noites {{count}}",',
    `    "duration.nights_one": "1 noite",
    "duration.nights_other": "{{count}} noites",`,
  ],
  [
    '    "member.reviews": "Comentários do {{count}}",',
    `    "member.reviews_one": "1 avaliação",
    "member.reviews_other": "{{count}} avaliações",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} é proprietário",',
    `    "member.sitsAsOwner_one": "1 estadia como proprietário",
    "member.sitsAsOwner_other": "{{count}} estadias como proprietário",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} fica como babá",',
    `    "member.sitsAsSitter_one": "1 estadia como sitter",
    "member.sitsAsSitter_other": "{{count}} estadias como sitter",`,
  ],
  [
    '    "owner.sitPeriods": "Períodos de sessão {{count}}",',
    `    "owner.sitPeriods_one": "1 período de estadia",
    "owner.sitPeriods_other": "{{count}} períodos de estadia",`,
  ],
  // el
  [
    '    "detail.ownerReviews": "Κριτικές κατόχων {{count}}",',
    `    "detail.ownerReviews_one": "1 κριτική κατόχου",
    "detail.ownerReviews_other": "{{count}} κριτικές κατόχων",`,
  ],
  [
    '    "detail.applicants":\n      "Οι κάτοικοι του {{count}} έχουν υποβάλει αίτηση · Χωρίς χρέωση διανυκτέρευσης",',
    `    "detail.applicants_one": "1 κοπιτρός έχει υποβάλει αίτηση · Χωρίς χρέωση διανυκτέρευσης",
    "detail.applicants_other": "{{count}} κοπιτροί έχουν υποβάλει αίτηση · Χωρίς χρέωση διανυκτέρευσης",`,
  ],
  [
    '    "duration.nights": "{{count}} νύχτες",',
    `    "duration.nights_one": "1 νύχτα",
    "duration.nights_other": "{{count}} νύχτες",`,
  ],
  [
    '    "member.reviews": "{{count}} κριτικές",',
    `    "member.reviews_one": "1 κριτική",
    "member.reviews_other": "{{count}} κριτικές",`,
  ],
  [
    '    "member.sitsAsOwner": "Ο {{count}} κάθεται ως ιδιοκτήτης",',
    `    "member.sitsAsOwner_one": "1 διαμονή ως ιδιοκτήτης",
    "member.sitsAsOwner_other": "{{count}} διαμονές ως ιδιοκτήτης",`,
  ],
  [
    '    "member.sitsAsSitter": "Το {{count}} κάθεται ως επιστάτης",',
    `    "member.sitsAsSitter_one": "1 διαμονή ως κοπιτρός",
    "member.sitsAsSitter_other": "{{count}} διαμονές ως κοπιτρός",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} καθιστικές περίοδοι",',
    `    "owner.sitPeriods_one": "1 περίοδος διαμονής",
    "owner.sitPeriods_other": "{{count}} περίοδοι διαμονής",`,
  ],
  // hr
  [
    '    "detail.ownerReviews": "Recenzije vlasnika {{count}}",',
    `    "detail.ownerReviews_one": "1 recenzija vlasnika",
    "detail.ownerReviews_few": "{{count}} recenzije vlasnika",
    "detail.ownerReviews_other": "{{count}} recenzija vlasnika",`,
  ],
  [
    '    "detail.applicants": "{{count}} dadilje su se prijavile · Nema naknade za noćenje",',
    `    "detail.applicants_one": "1 dadilja se prijavila · Nema naknade za noćenje",
    "detail.applicants_few": "{{count}} dadilje su se prijavile · Nema naknade za noćenje",
    "detail.applicants_other": "{{count}} dadilja se prijavilo · Nema naknade za noćenje",`,
  ],
  [
    '    "duration.nights": "{{count}} noći",',
    `    "duration.nights_one": "1 noć",
    "duration.nights_few": "{{count}} noći",
    "duration.nights_other": "{{count}} noći",`,
  ],
  [
    '    "member.reviews": "{{count}} recenzije",',
    `    "member.reviews_one": "1 recenzija",
    "member.reviews_few": "{{count}} recenzije",
    "member.reviews_other": "{{count}} recenzija",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} sjedi kao vlasnik",',
    `    "member.sitsAsOwner_one": "1 boravak kao vlasnik",
    "member.sitsAsOwner_few": "{{count}} boravka kao vlasnik",
    "member.sitsAsOwner_other": "{{count}} boravaka kao vlasnik",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} sjedi kao dadilja",',
    `    "member.sitsAsSitter_one": "1 boravak kao dadilja",
    "member.sitsAsSitter_few": "{{count}} boravka kao dadilja",
    "member.sitsAsSitter_other": "{{count}} boravaka kao dadilja",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} periodi sjedenja",',
    `    "owner.sitPeriods_one": "1 period boravka",
    "owner.sitPeriods_few": "{{count}} perioda boravka",
    "owner.sitPeriods_other": "{{count}} perioda boravka",`,
  ],
  // tr
  [
    '    "detail.ownerReviews": "{{count}} sahibi değerlendirmeleri",',
    `    "detail.ownerReviews_one": "1 sahip değerlendirmesi",
    "detail.ownerReviews_other": "{{count}} sahip değerlendirmesi",`,
  ],
  [
    '    "detail.applicants": "{{count}} bakıcıları başvurdu · Gecelik ücret yok",',
    `    "detail.applicants_one": "1 bakıcı başvurdu · Gecelik ücret yok",
    "detail.applicants_other": "{{count}} bakıcı başvurdu",`,
  ],
  [
    '    "duration.nights": "{{count}} geceler",',
    `    "duration.nights_one": "1 gece",
    "duration.nights_other": "{{count}} gece",`,
  ],
  [
    '    "member.reviews": "{{count}} incelemeleri",',
    `    "member.reviews_one": "1 inceleme",
    "member.reviews_other": "{{count}} inceleme",`,
  ],
  [
    '    "member.sitsAsOwner": "{{count}} sahibi olarak oturuyor",',
    `    "member.sitsAsOwner_one": "1 konaklama sahibi olarak",
    "member.sitsAsOwner_other": "{{count}} konaklama sahibi olarak",`,
  ],
  [
    '    "member.sitsAsSitter": "{{count}} bakıcı olarak oturuyor",',
    `    "member.sitsAsSitter_one": "1 konaklama bakıcı olarak",
    "member.sitsAsSitter_other": "{{count}} konaklama bakıcı olarak",`,
  ],
  [
    '    "owner.sitPeriods": "{{count}} oturma dönemleri",',
    `    "owner.sitPeriods_one": "1 konaklama dönemi",
    "owner.sitPeriods_other": "{{count}} konaklama dönemi",`,
  ],
];

const appTranslationsReplacements = [
  // en
  [
    '  "applications.subtitle": "{{count}} people have reached out about this sit.",',
    `  "applications.subtitle_one": "1 person has reached out about this sit.",
  "applications.subtitle_other": "{{count}} people have reached out about this sit.",`,
  ],
  [
    '  "reviews.summary": "{{average}} out of 5 from {{count}} reviews",',
    `  "reviews.summary_one": "{{average}} out of 5 from 1 review",
  "reviews.summary_other": "{{average}} out of 5 from {{count}} reviews",`,
  ],
  [
    '  "reviews.viewAll": "View all {{count}} reviews",',
    `  "reviews.viewAll_one": "View 1 review",
  "reviews.viewAll_other": "View all {{count}} reviews",`,
  ],
  [
    '  "reviews.starOption": "{{count}} stars",',
    `  "reviews.starOption_one": "1 star",
  "reviews.starOption_other": "{{count}} stars",`,
  ],
  [
    '  "applications.yearsExperience": "{{count}} years of boating experience",',
    `  "applications.yearsExperience_one": "1 year of boating experience",
  "applications.yearsExperience_other": "{{count}} years of boating experience",`,
  ],
  [
    '  "applications.priorSitsCount": "Prior boat sits completed: {{count}}",',
    `  "applications.priorSitsCount_one": "Prior boat sits completed: 1",
  "applications.priorSitsCount_other": "Prior boat sits completed: {{count}}",`,
  ],
  [
    '  "detail.maxGuests": "Maximum {{count}} people",',
    `  "detail.maxGuests_one": "Maximum 1 person",
  "detail.maxGuests_other": "Maximum {{count}} people",`,
  ],
  [
    `  "apply.partySizeHint":
    "Include yourself and any partner or companion. This sit allows up to {{count}} people.",`,
    `  "apply.partySizeHint_one":
    "Include yourself and any partner or companion. This sit allows up to 1 person.",
  "apply.partySizeHint_other":
    "Include yourself and any partner or companion. This sit allows up to {{count}} people.",`,
  ],
  // fr
  [
    '    "applications.subtitle": "{{count}} personnes ont manifesté leur intérêt pour cette garde.",',
    `    "applications.subtitle_one": "1 personne a manifesté son intérêt pour cette garde.",
    "applications.subtitle_other": "{{count}} personnes ont manifesté leur intérêt pour cette garde.",`,
  ],
  [
    '    "reviews.summary": "{{average}} sur 5 d’après {{count}} avis",',
    `    "reviews.summary_one": "{{average}} sur 5 d’après 1 avis",
    "reviews.summary_other": "{{average}} sur 5 d’après {{count}} avis",`,
  ],
  [
    '    "reviews.viewAll": "Voir les {{count}} avis",',
    `    "reviews.viewAll_one": "Voir 1 avis",
    "reviews.viewAll_other": "Voir les {{count}} avis",`,
  ],
  [
    '    "reviews.starOption": "{{count}} étoiles",',
    `    "reviews.starOption_one": "1 étoile",
    "reviews.starOption_other": "{{count}} étoiles",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} ans d’expérience nautique",',
    `    "applications.yearsExperience_one": "1 an d’expérience nautique",
    "applications.yearsExperience_other": "{{count}} ans d’expérience nautique",`,
  ],
  [
    '    "applications.priorSitsCount": "Gardes de bateau terminées : {{count}}",',
    `    "applications.priorSitsCount_one": "Gardes de bateau terminées : 1",
    "applications.priorSitsCount_other": "Gardes de bateau terminées : {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "{{count}} personnes maximum",',
    `    "detail.maxGuests_one": "1 personne maximum",
    "detail.maxGuests_other": "{{count}} personnes maximum",`,
  ],
  // es, it, de, nl, pt, el, hr, tr - abbreviated: use same pattern with locale-specific strings from file
];

// Append remaining locale blocks for applicationTranslations
const moreAppReplacements = [
  // es
  [
    '    "applications.subtitle": "{{count}} personas han mostrado interés en esta estancia.",',
    `    "applications.subtitle_one": "1 persona ha mostrado interés en esta estancia.",
    "applications.subtitle_other": "{{count}} personas han mostrado interés en esta estancia.",`,
  ],
  [
    '    "reviews.summary": "{{average}} de 5 según {{count}} opiniones",',
    `    "reviews.summary_one": "{{average}} de 5 según 1 opinión",
    "reviews.summary_other": "{{average}} de 5 según {{count}} opiniones",`,
  ],
  [
    '    "reviews.viewAll": "Ver las {{count}} opiniones",',
    `    "reviews.viewAll_one": "Ver 1 opinión",
    "reviews.viewAll_other": "Ver las {{count}} opiniones",`,
  ],
  [
    '    "reviews.starOption": "{{count}} estrellas",',
    `    "reviews.starOption_one": "1 estrella",
    "reviews.starOption_other": "{{count}} estrellas",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} años de experiencia náutica",',
    `    "applications.yearsExperience_one": "1 año de experiencia náutica",
    "applications.yearsExperience_other": "{{count}} años de experiencia náutica",`,
  ],
  [
    '    "applications.priorSitsCount": "Estancias de barco completadas: {{count}}",',
    `    "applications.priorSitsCount_one": "Estancias de barco completadas: 1",
    "applications.priorSitsCount_other": "Estancias de barco completadas: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Máximo {{count}} personas",',
    `    "detail.maxGuests_one": "Máximo 1 persona",
    "detail.maxGuests_other": "Máximo {{count}} personas",`,
  ],
  // it
  [
    '    "applications.subtitle": "{{count}} persone hanno mostrato interesse per questo soggiorno.",',
    `    "applications.subtitle_one": "1 persona ha mostrato interesse per questo soggiorno.",
    "applications.subtitle_other": "{{count}} persone hanno mostrato interesse per questo soggiorno.",`,
  ],
  [
    '    "reviews.summary": "{{average}} su 5 da {{count}} recensioni",',
    `    "reviews.summary_one": "{{average}} su 5 da 1 recensione",
    "reviews.summary_other": "{{average}} su 5 da {{count}} recensioni",`,
  ],
  [
    '    "reviews.viewAll": "Vedi tutte le {{count}} recensioni",',
    `    "reviews.viewAll_one": "Vedi 1 recensione",
    "reviews.viewAll_other": "Vedi tutte le {{count}} recensioni",`,
  ],
  [
    '    "reviews.starOption": "{{count}} stelle",',
    `    "reviews.starOption_one": "1 stella",
    "reviews.starOption_other": "{{count}} stelle",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} anni di esperienza nautica",',
    `    "applications.yearsExperience_one": "1 anno di esperienza nautica",
    "applications.yearsExperience_other": "{{count}} anni di esperienza nautica",`,
  ],
  [
    '    "applications.priorSitsCount": "Soggiorni in barca completati: {{count}}",',
    `    "applications.priorSitsCount_one": "Soggiorni in barca completati: 1",
    "applications.priorSitsCount_other": "Soggiorni in barca completati: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Massimo {{count}} persone",',
    `    "detail.maxGuests_one": "Massimo 1 persona",
    "detail.maxGuests_other": "Massimo {{count}} persone",`,
  ],
  // de
  [
    '    "applications.subtitle": "{{count}} Personen interessieren sich für diesen Aufenthalt.",',
    `    "applications.subtitle_one": "1 Person interessiert sich für diesen Aufenthalt.",
    "applications.subtitle_other": "{{count}} Personen interessieren sich für diesen Aufenthalt.",`,
  ],
  [
    '    "reviews.summary": "{{average}} von 5 aus {{count}} Bewertungen",',
    `    "reviews.summary_one": "{{average}} von 5 aus 1 Bewertung",
    "reviews.summary_other": "{{average}} von 5 aus {{count}} Bewertungen",`,
  ],
  [
    '    "reviews.viewAll": "Alle {{count}} Bewertungen anzeigen",',
    `    "reviews.viewAll_one": "1 Bewertung anzeigen",
    "reviews.viewAll_other": "Alle {{count}} Bewertungen anzeigen",`,
  ],
  [
    '    "reviews.starOption": "{{count}} Sterne",',
    `    "reviews.starOption_one": "1 Stern",
    "reviews.starOption_other": "{{count}} Sterne",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} Jahre Bootserfahrung",',
    `    "applications.yearsExperience_one": "1 Jahr Bootserfahrung",
    "applications.yearsExperience_other": "{{count}} Jahre Bootserfahrung",`,
  ],
  [
    '    "applications.priorSitsCount": "Abgeschlossene Bootsaufenthalte: {{count}}",',
    `    "applications.priorSitsCount_one": "Abgeschlossene Bootsaufenthalte: 1",
    "applications.priorSitsCount_other": "Abgeschlossene Bootsaufenthalte: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Maximal {{count}} Personen",',
    `    "detail.maxGuests_one": "Maximal 1 Person",
    "detail.maxGuests_other": "Maximal {{count}} Personen",`,
  ],
  // nl
  [
    '    "applications.subtitle": "{{count}} mensen hebben interesse getoond in dit verblijf.",',
    `    "applications.subtitle_one": "1 persoon heeft interesse getoond in dit verblijf.",
    "applications.subtitle_other": "{{count}} mensen hebben interesse getoond in dit verblijf.",`,
  ],
  [
    '    "reviews.summary": "{{average}} van 5 uit {{count}} beoordelingen",',
    `    "reviews.summary_one": "{{average}} van 5 uit 1 beoordeling",
    "reviews.summary_other": "{{average}} van 5 uit {{count}} beoordelingen",`,
  ],
  [
    '    "reviews.viewAll": "Bekijk alle {{count}} beoordelingen",',
    `    "reviews.viewAll_one": "Bekijk 1 beoordeling",
    "reviews.viewAll_other": "Bekijk alle {{count}} beoordelingen",`,
  ],
  [
    '    "reviews.starOption": "{{count}} sterren",',
    `    "reviews.starOption_one": "1 ster",
    "reviews.starOption_other": "{{count}} sterren",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} jaar vaarervaring",',
    `    "applications.yearsExperience_one": "1 jaar vaarervaring",
    "applications.yearsExperience_other": "{{count}} jaar vaarervaring",`,
  ],
  [
    '    "applications.priorSitsCount": "Voltooide bootverblijven: {{count}}",',
    `    "applications.priorSitsCount_one": "Voltooide bootverblijven: 1",
    "applications.priorSitsCount_other": "Voltooide bootverblijven: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Maximaal {{count}} personen",',
    `    "detail.maxGuests_one": "Maximaal 1 persoon",
    "detail.maxGuests_other": "Maximaal {{count}} personen",`,
  ],
  // pt
  [
    '    "applications.subtitle": "{{count}} pessoas demonstraram interesse nesta estadia.",',
    `    "applications.subtitle_one": "1 pessoa demonstrou interesse nesta estadia.",
    "applications.subtitle_other": "{{count}} pessoas demonstraram interesse nesta estadia.",`,
  ],
  [
    '    "reviews.summary": "{{average}} de 5 com base em {{count}} avaliações",',
    `    "reviews.summary_one": "{{average}} de 5 com base em 1 avaliação",
    "reviews.summary_other": "{{average}} de 5 com base em {{count}} avaliações",`,
  ],
  [
    '    "reviews.viewAll": "Ver as {{count}} avaliações",',
    `    "reviews.viewAll_one": "Ver 1 avaliação",
    "reviews.viewAll_other": "Ver as {{count}} avaliações",`,
  ],
  [
    '    "reviews.starOption": "{{count}} estrelas",',
    `    "reviews.starOption_one": "1 estrela",
    "reviews.starOption_other": "{{count}} estrelas",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} anos de experiência náutica",',
    `    "applications.yearsExperience_one": "1 ano de experiência náutica",
    "applications.yearsExperience_other": "{{count}} anos de experiência náutica",`,
  ],
  [
    '    "applications.priorSitsCount": "Estadias de barco concluídas: {{count}}",',
    `    "applications.priorSitsCount_one": "Estadias de barco concluídas: 1",
    "applications.priorSitsCount_other": "Estadias de barco concluídas: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Máximo de {{count}} pessoas",',
    `    "detail.maxGuests_one": "Máximo de 1 pessoa",
    "detail.maxGuests_other": "Máximo de {{count}} pessoas",`,
  ],
  // el
  [
    '    "applications.subtitle": "{{count}} άτομα ενδιαφέρθηκαν για αυτή τη διαμονή.",',
    `    "applications.subtitle_one": "1 άτομο ενδιαφέρθηκε για αυτή τη διαμονή.",
    "applications.subtitle_other": "{{count}} άτομα ενδιαφέρθηκαν για αυτή τη διαμονή.",`,
  ],
  [
    '    "reviews.summary": "{{average}} από 5 από {{count}} κριτικές",',
    `    "reviews.summary_one": "{{average}} από 5 από 1 κριτική",
    "reviews.summary_other": "{{average}} από 5 από {{count}} κριτικές",`,
  ],
  [
    '    "reviews.viewAll": "Δείτε και τις {{count}} κριτικές",',
    `    "reviews.viewAll_one": "Δείτε 1 κριτική",
    "reviews.viewAll_other": "Δείτε και τις {{count}} κριτικές",`,
  ],
  [
    '    "reviews.starOption": "{{count}} αστέρια",',
    `    "reviews.starOption_one": "1 αστέρι",
    "reviews.starOption_other": "{{count}} αστέρια",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} χρόνια ναυτικής εμπειρίας",',
    `    "applications.yearsExperience_one": "1 χρόνος ναυτικής εμπειρίας",
    "applications.yearsExperience_other": "{{count}} χρόνια ναυτικής εμπειρίας",`,
  ],
  [
    '    "applications.priorSitsCount": "Ολοκληρωμένες διαμονές σε σκάφος: {{count}}",',
    `    "applications.priorSitsCount_one": "Ολοκληρωμένες διαμονές σε σκάφος: 1",
    "applications.priorSitsCount_other": "Ολοκληρωμένες διαμονές σε σκάφος: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Έως {{count}} άτομα",',
    `    "detail.maxGuests_one": "Έως 1 άτομο",
    "detail.maxGuests_other": "Έως {{count}} άτομα",`,
  ],
  // hr
  [
    '    "applications.subtitle": "{{count}} osoba javilo se za ovaj boravak.",',
    `    "applications.subtitle_one": "1 osoba se javila za ovaj boravak.",
    "applications.subtitle_few": "{{count}} osobe su se javile za ovaj boravak.",
    "applications.subtitle_other": "{{count}} osoba se javilo za ovaj boravak.",`,
  ],
  [
    '    "reviews.summary": "{{average}} od 5 iz {{count}} recenzija",',
    `    "reviews.summary_one": "{{average}} od 5 iz 1 recenzije",
    "reviews.summary_few": "{{average}} od 5 iz {{count}} recenzije",
    "reviews.summary_other": "{{average}} od 5 iz {{count}} recenzija",`,
  ],
  [
    '    "reviews.viewAll": "Pogledaj svih {{count}} recenzija",',
    `    "reviews.viewAll_one": "Pogledaj 1 recenziju",
    "reviews.viewAll_few": "Pogledaj sve {{count}} recenzije",
    "reviews.viewAll_other": "Pogledaj svih {{count}} recenzija",`,
  ],
  [
    '    "reviews.starOption": "{{count}} zvjezdica",',
    `    "reviews.starOption_one": "1 zvjezdica",
    "reviews.starOption_few": "{{count}} zvjezdice",
    "reviews.starOption_other": "{{count}} zvjezdica",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} godina iskustva s brodovima",',
    `    "applications.yearsExperience_one": "1 godina iskustva s brodovima",
    "applications.yearsExperience_few": "{{count}} godine iskustva s brodovima",
    "applications.yearsExperience_other": "{{count}} godina iskustva s brodovima",`,
  ],
  [
    '    "applications.priorSitsCount": "Završeni boravci na brodu: {{count}}",',
    `    "applications.priorSitsCount_one": "Završeni boravci na brodu: 1",
    "applications.priorSitsCount_few": "Završeni boravci na brodu: {{count}}",
    "applications.priorSitsCount_other": "Završeni boravci na brodu: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "Najviše {{count}} osoba",',
    `    "detail.maxGuests_one": "Najviše 1 osoba",
    "detail.maxGuests_few": "Najviše {{count}} osobe",
    "detail.maxGuests_other": "Najviše {{count}} osoba",`,
  ],
  // tr
  [
    '    "applications.subtitle": "{{count}} kişi bu konaklamayla ilgilendi.",',
    `    "applications.subtitle_one": "1 kişi bu konaklamayla ilgilendi.",
    "applications.subtitle_other": "{{count}} kişi bu konaklamayla ilgilendi.",`,
  ],
  [
    '    "reviews.summary": "{{count}} değerlendirmeden {{average}} / 5",',
    `    "reviews.summary_one": "1 değerlendirmeden {{average}} / 5",
    "reviews.summary_other": "{{count}} değerlendirmeden {{average}} / 5",`,
  ],
  [
    '    "reviews.viewAll": "Tüm {{count}} değerlendirmeyi gör",',
    `    "reviews.viewAll_one": "1 değerlendirmeyi gör",
    "reviews.viewAll_other": "Tüm {{count}} değerlendirmeyi gör",`,
  ],
  [
    '    "reviews.starOption": "{{count}} yıldız",',
    `    "reviews.starOption_one": "1 yıldız",
    "reviews.starOption_other": "{{count}} yıldız",`,
  ],
  [
    '    "applications.yearsExperience": "{{count}} yıllık tekne deneyimi",',
    `    "applications.yearsExperience_one": "1 yıllık tekne deneyimi",
    "applications.yearsExperience_other": "{{count}} yıllık tekne deneyimi",`,
  ],
  [
    '    "applications.priorSitsCount": "Tamamlanmış tekne konaklaması: {{count}}",',
    `    "applications.priorSitsCount_one": "Tamamlanmış tekne konaklaması: 1",
    "applications.priorSitsCount_other": "Tamamlanmış tekne konaklaması: {{count}}",`,
  ],
  [
    '    "detail.maxGuests": "En fazla {{count}} kişi",',
    `    "detail.maxGuests_one": "En fazla 1 kişi",
    "detail.maxGuests_other": "En fazla {{count}} kişi",`,
  ],
];

applyReplacements(join(root, "src/react-app/localeExtras.ts"), localeExtrasReplacements);
applyReplacements(
  join(root, "src/react-app/applicationTranslations.ts"),
  [...appTranslationsReplacements, ...moreAppReplacements],
);

// i18n boats.results
const i18nPath = join(root, "src/react-app/i18n.ts");
let i18n = readFileSync(i18nPath, "utf8");
const i18nBoatsReplacements = [
  [
    '  "boats.results": "{{count}} sits found",',
    `  "boats.results_one": "1 sit found",
  "boats.results_other": "{{count}} sits found",`,
  ],
  [
    '  "boats.results": "{{count}} gardes trouvées",',
    `  "boats.results_one": "1 garde trouvée",
  "boats.results_other": "{{count}} gardes trouvées",`,
  ],
  [
    '  "boats.results": "{{count}} estancias encontradas",',
    `  "boats.results_one": "1 estancia encontrada",
  "boats.results_other": "{{count}} estancias encontradas",`,
  ],
  [
    '  "boats.results": "{{count}} soggiorni trovati",',
    `  "boats.results_one": "1 soggiorno trovato",
  "boats.results_other": "{{count}} soggiorni trovati",`,
  ],
  [
    '  "boats.results": "{{count}} Sits gefunden",',
    `  "boats.results_one": "1 Sit gefunden",
  "boats.results_other": "{{count}} Sits gefunden",`,
  ],
  [
    '  "boats.results": "{{count}} verblijven gevonden",',
    `  "boats.results_one": "1 verblijf gevonden",
  "boats.results_other": "{{count}} verblijven gevonden",`,
  ],
  [
    '  "boats.results": "{{count}} estadias encontradas",',
    `  "boats.results_one": "1 estadia encontrada",
  "boats.results_other": "{{count}} estadias encontradas",`,
  ],
  [
    '  "boats.results": "Βρέθηκαν {{count}} διαμονές",',
    `  "boats.results_one": "Βρέθηκε 1 διαμονή",
  "boats.results_other": "Βρέθηκαν {{count}} διαμονές",`,
  ],
  [
    '  "boats.results": "Pronađeno boravaka: {{count}}",',
    `  "boats.results_one": "Pronađen 1 boravak",
  "boats.results_few": "Pronađena {{count}} boravka",
  "boats.results_other": "Pronađeno {{count}} boravaka",`,
  ],
  [
    '  "boats.results": "{{count}} konaklama bulundu",',
    `  "boats.results_one": "1 konaklama bulundu",
  "boats.results_other": "{{count}} konaklama bulundu",`,
  ],
];
applyReplacements(i18nPath, i18nBoatsReplacements);

console.log("Plural keys applied.");

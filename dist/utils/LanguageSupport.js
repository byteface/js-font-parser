var LANGUAGES = [
    { code: 'en', name: 'English', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' },
    { code: 'es', name: 'Spanish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúüñÁÉÍÓÚÜÑ' },
    { code: 'fr', name: 'French', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàâçéèêëîïôùûüÿœæÀÂÇÉÈÊËÎÏÔÙÛÜŸŒÆ' },
    { code: 'de', name: 'German', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzäöüßÄÖÜ' },
    { code: 'pt', name: 'Portuguese', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáàâãçéêíóôõúÁÀÂÃÇÉÊÍÓÔÕÚ' },
    { code: 'it', name: 'Italian', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ' },
    { code: 'nl', name: 'Dutch', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéëïíóöüúÁÉËÏÍÓÖÜÚ' },
    { code: 'sv', name: 'Swedish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåäöÅÄÖ' },
    { code: 'no', name: 'Norwegian', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåæøÅÆØ' },
    { code: 'da', name: 'Danish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåæøÅÆØ' },
    { code: 'fi', name: 'Finnish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåäöÅÄÖ' },
    { code: 'pl', name: 'Polish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyząćęłńóśźżĄĆĘŁŃÓŚŹŻ' },
    { code: 'cs', name: 'Czech', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ' },
    { code: 'hu', name: 'Hungarian', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóöőúüűÁÉÍÓÖŐÚÜŰ' },
    { code: 'tr', name: 'Turkish', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzçğışöüİÇĞIŞÖÜ' },
    { code: 'ro', name: 'Romanian', required: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzăâîșțĂÂÎȘȚ' },
    { code: 'ru', name: 'Russian (Cyrillic)', required: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя' },
    { code: 'uk', name: 'Ukrainian', required: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя' },
    { code: 'el', name: 'Greek', required: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωάέήίόύώϊΐϋΰ' },
    { code: 'he', name: 'Hebrew', required: 'אבגדהוזחטיךכלםמןנסעףפץצקרשת' },
    { code: 'ar', name: 'Arabic', required: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي', notes: 'Requires shaping (not applied during layout).' },
    { code: 'hi', name: 'Hindi (Devanagari)', required: 'अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह', notes: 'Requires shaping (not applied during layout).' }
];
function uniqueChars(str) {
    return Array.from(new Set(Array.from(str)));
}
export function supportsLanguage(font, code) {
    var lang = LANGUAGES.find(function (l) { return l.code === code; });
    if (!lang)
        return null;
    var requiredChars = uniqueChars(lang.required);
    var missing = requiredChars.filter(function (ch) { return !font.getGlyphIndexByChar(ch); });
    var coverage = requiredChars.length === 0 ? 1 : (requiredChars.length - missing.length) / requiredChars.length;
    return {
        code: lang.code,
        name: lang.name,
        supported: missing.length === 0,
        missing: missing,
        coverage: coverage,
        notes: lang.notes
    };
}
export function getSupportedLanguages(font) {
    return LANGUAGES.map(function (lang) { return supportsLanguage(font, lang.code); }).filter(Boolean);
}
export function listLanguages() {
    return LANGUAGES.slice();
}
